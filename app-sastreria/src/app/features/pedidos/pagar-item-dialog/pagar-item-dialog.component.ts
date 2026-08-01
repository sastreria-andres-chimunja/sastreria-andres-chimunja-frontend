import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PedidoService } from '../../../core/services/pedido.service';
import { ReciboService } from '../../../core/services/recibo.service';

export interface PagarItemDialogData {
  idPedido: number;
  valorTotalPedido: number;
  nombreCliente: string;
  telefonoCliente?: string;
  metodosPago: any[];
  items?: { descripcion: string; valor: number }[];
  fechaEntrega?: string;
  tokenPublico?: string;
}

@Component({
  selector: 'app-pagar-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './pagar-item-dialog.component.html',
  styleUrl: './pagar-item-dialog.component.css',
})
export class PagarItemDialogComponent implements OnInit {
  form!: FormGroup;
  cargando = true;
  guardando    = false;
  generandoPDF = false;
  enviandoWhatsApp = false;
  urlFallback: string | null = null;
  avisoPegarImagen = false;
  abonos: any[] = [];
  totalAbonado  = 0;
  ultimoAbono: any = null;

  constructor(
    public dialogRef: MatDialogRef<PagarItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PagarItemDialogData,
    private fb: FormBuilder,
    private pedidoService: PedidoService,
    private reciboService: ReciboService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      idMetodoPago: [null, Validators.required],
      valor: [null, [Validators.required, Validators.min(1)]],
      observacion: [''],
    });
    this.cargarAbonos();
  }

  cargarAbonos(): void {
    this.cargando = true;
    this.pedidoService.getAbonosPedido(this.data.idPedido).subscribe({
      next: (resp: any) => {
        this.abonos = resp.abonos ?? [];
        this.totalAbonado = this.abonos.reduce((s: number, a: any) => s + Number(a.valor), 0);
        this.cargando = false;
      },
      error: () => { this.cargando = false; },
    });
  }

  get saldo(): number {
    return this.data.valorTotalPedido - this.totalAbonado;
  }

  get porcentajePagado(): number {
    const total = this.data.valorTotalPedido;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((this.totalAbonado / total) * 100));
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const { idMetodoPago, valor, observacion } = this.form.value;
    this.pedidoService.registrarAbono(this.data.idPedido, { idMetodoPago, valor, observacion }).subscribe({
      next: (resp: any) => {
        this.abonos = resp.abonos ?? [];
        this.totalAbonado = resp.totalAbonado ?? 0;
        const metodo = this.data.metodosPago.find(m => m.idMetodoPago === idMetodoPago);
        this.ultimoAbono = {
          idMetodoPago,
          valor,
          observacion,
          nombreMetodoPago: metodo?.nombreMetodoPago ?? '',
        };
        this.guardando = false;
        this.form.reset();
      },
      error: () => { this.guardando = false; },
    });
  }

  imprimirRecibo(): void {
    const metodo = this.ultimoAbono?.nombreMetodoPago ?? '';
    this.reciboService.imprimir({
      idPedido: this.data.idPedido,
      idItemPedido: 0,
      nombreCliente: this.data.nombreCliente,
      telefonoCliente: this.data.telefonoCliente,
      valorTotalPedido: this.data.valorTotalPedido,
      valorAbono: this.ultimoAbono?.valor ?? 0,
      totalPagadoPedido: this.totalAbonado,
      metodoPago: metodo,
      fechaPago: new Date().toLocaleDateString('es-CO'),
    });
  }

  private get reciboData() {
    return {
      idPedido:          this.data.idPedido,
      idItemPedido:      0,
      nombreCliente:     this.data.nombreCliente,
      telefonoCliente:   this.data.telefonoCliente,
      valorTotalPedido:  this.data.valorTotalPedido,
      valorAbono:        this.ultimoAbono?.valor ?? 0,
      totalPagadoPedido: this.totalAbonado,
      metodoPago:        this.ultimoAbono?.nombreMetodoPago ?? '',
      fechaPago:         new Date().toLocaleDateString('es-CO'),
      fechaEntrega:      this.data.fechaEntrega,
      items:             this.data.items,
      tokenPublico:      this.data.tokenPublico,
    };
  }

  /** Genera el PDF y lo descarga directo, para quien quiera guardarlo/imprimirlo aparte. */
  async generarPDF(): Promise<void> {
    this.generandoPDF = true;
    try {
      const archivo = await this.reciboService.generarPDFBlob(this.reciboData);
      this.reciboService.descargarBlob(archivo, archivo.name);
    } finally {
      this.generandoPDF = false;
    }
  }

  /**
   * Genera una imagen del recibo y la deja lista para enviar por WhatsApp
   * (se ve grande de inmediato en el chat, como un comprobante bancario).
   * Siempre usa el método manual (copiar al portapapeles + abrir el chat del
   * cliente, o compartir nativo en celular si el portapapeles no está
   * disponible) — el envío automático vía backend (Meta Cloud API) se
   * desactivó a propósito: ese envío sale desde el número nuevo registrado
   * en la API, no desde el número que ya conocen los clientes.
   */
  async enviarWhatsApp(): Promise<void> {
    if (!this.data.telefonoCliente) return;
    const texto = this.reciboService.generarTextoWhatsApp(this.reciboData);

    this.enviandoWhatsApp = true;
    this.urlFallback = null;
    this.avisoPegarImagen = false;
    try {
      const imagen = await this.reciboService.generarImagenBlob(this.reciboData);
      const resultado = await this.reciboService.compartirConWhatsApp(imagen, this.data.telefonoCliente, texto);
      if (resultado === '_clipboard_') this.avisoPegarImagen = true;
      else if (resultado) this.urlFallback = resultado;
    } finally {
      this.enviandoWhatsApp = false;
    }
  }

  abrirWhatsAppFallback(): void {
    if (this.urlFallback) this.reciboService.abrirChatWhatsApp(this.urlFallback);
  }

  cerrar(): void { this.dialogRef.close({ totalAbonado: this.totalAbonado }); }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
