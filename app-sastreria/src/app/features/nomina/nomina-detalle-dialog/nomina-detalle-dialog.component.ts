import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NominaService } from '../../../core/services/nomina.service';
import { ItemPedidoService } from '../../../core/services/item-pedido.service';
import { ReciboService, ReciboNominaData } from '../../../core/services/recibo.service';

export interface NominaDetalleDialogData {
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  fechaInicio?: string;
  fechaFin?: string;
  soloLectura?: boolean;
  historial?: boolean;
}

@Component({
  selector: 'app-nomina-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './nomina-detalle-dialog.component.html',
  styleUrl: './nomina-detalle-dialog.component.css',
})
export class NominaDetalleDialogComponent implements OnInit {
  cargando = true;
  detalle: any = null;
  pagandoId: number | null = null;
  pagandoTodo = false;
  ultimoItemPagado: any = null;
  generandoPDFNomina = false;
  enviandoWhatsAppNomina = false;
  urlFallbackNomina: string | null = null;
  avisoPegarImagenNomina = false;

  constructor(
    public dialogRef: MatDialogRef<NominaDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NominaDetalleDialogData,
    private nominaService: NominaService,
    private itemPedidoService: ItemPedidoService,
    private reciboService: ReciboService,
  ) {}

  ngOnInit(): void {
    this.cargarDetalle();
  }

  get esHistorial(): boolean {
    return !!(this.data.historial);
  }

  cargarDetalle(): void {
    this.cargando = true;
    this.nominaService
      .nominaEmpleado(this.data.idEmpleado, this.data.fechaInicio, this.data.fechaFin, this.esHistorial)
      .subscribe({
        next: (resp: any) => {
          this.detalle = resp.nominaEmpleado;
          this.cargando = false;
        },
        error: () => { this.cargando = false; },
      });
  }

  pagar(item: any): void {
    this.pagandoId = item.idItemPedido;
    this.ultimoItemPagado   = null;
    this.urlFallbackNomina  = null;
    this.avisoPegarImagenNomina = false;
    this.itemPedidoService.pagar(item.idItemPedido).subscribe({
      next: (resp: any) => {
        this.pagandoId = null;
        this.ultimoItemPagado = resp.item ?? item;
        this.cargarDetalle();
      },
      error: () => { this.pagandoId = null; },
    });
  }

  private get nominaReciboData(): ReciboNominaData {
    const item = this.ultimoItemPagado!;
    const valorEmpleado = Number(item.valorEmpleado ?? 0)
      || (Number(item.valor ?? 0) * Number(item.comisionEmpleado ?? 0) / 100);
    return {
      idItemPedido:    item.idItemPedido,
      idPedido:        item.idPedido,
      nombreEmpleado:  `${this.data.nombres} ${this.data.apellidos}`,
      telefonoEmpleado: this.data.telefono,
      descripcion:     item.descripcion ?? '',
      valor:           valorEmpleado,
      fechaPago:       new Date().toLocaleDateString('es-CO'),
    };
  }

  imprimirTicketNomina(): void {
    if (!this.ultimoItemPagado) return;
    this.reciboService.imprimirNomina(this.nominaReciboData);
  }

  /** Genera el PDF y lo descarga directo, para quien quiera guardarlo/imprimirlo aparte. */
  async generarPDFNomina(): Promise<void> {
    this.generandoPDFNomina = true;
    try {
      const archivo = await this.reciboService.generarPDFBlobNomina(this.nominaReciboData);
      this.reciboService.descargarBlob(archivo, archivo.name);
    } finally {
      this.generandoPDFNomina = false;
    }
  }

  /**
   * Genera una imagen del comprobante y la deja lista para enviar por
   * WhatsApp (se ve grande de inmediato en el chat, como un comprobante
   * bancario). Siempre usa el método manual (copiar al portapapeles + abrir
   * el chat del empleado, o compartir nativo en celular si el portapapeles
   * no está disponible) — el envío automático vía backend (Meta Cloud API)
   * se desactivó a propósito: ese envío sale desde el número nuevo
   * registrado en la API, no desde el número que ya conocen los empleados.
   */
  async enviarWhatsAppNomina(): Promise<void> {
    if (!this.data.telefono) return;
    const texto = this.reciboService.generarTextoWhatsAppNomina(this.nominaReciboData);

    this.enviandoWhatsAppNomina = true;
    this.urlFallbackNomina = null;
    this.avisoPegarImagenNomina = false;
    try {
      const imagen = await this.reciboService.generarImagenBlobNomina(this.nominaReciboData);
      const resultado = await this.reciboService.compartirConWhatsApp(imagen, this.data.telefono, texto);
      if (resultado === '_clipboard_') this.avisoPegarImagenNomina = true;
      else if (resultado) this.urlFallbackNomina = resultado;
    } finally {
      this.enviandoWhatsAppNomina = false;
    }
  }

  abrirWhatsAppFallbackNomina(): void {
    if (this.urlFallbackNomina) this.reciboService.abrirChatWhatsApp(this.urlFallbackNomina);
  }

  pagarTodo(): void {
    const pendientes = this.detalle?.entradas?.items ?? [];
    if (pendientes.length === 0) return;
    this.pagandoTodo       = true;
    this.ultimoItemPagado  = null;
    this.urlFallbackNomina = null;
    this.avisoPegarImagenNomina = false;

    this.nominaService.liquidar(this.data.idEmpleado).subscribe({
      next: () => {
        this.pagandoTodo = false;
        this.cargarDetalle();
      },
      error: () => { this.pagandoTodo = false; },
    });
  }

  actualizarComision(item: any, pct: number): void {
    const comision = Math.max(0, Math.min(100, Number(pct) || 0));
    this.itemPedidoService.actualizarComision(item.idItemPedido, comision).subscribe({
      next: () => {
        item.comisionEmpleado = comision;
        item.valorEmpleado = Number(item.valor ?? 0) * comision / 100;
        if (this.detalle?.entradas?.items) {
          this.detalle.entradas.total = this.detalle.entradas.items.reduce(
            (s: number, i: any) => s + Number(i.valorEmpleado ?? 0), 0
          );
          this.detalle.saldo = this.detalle.entradas.total - (this.detalle.salidas?.total ?? 0);
        }
      },
    });
  }

  getInitials(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }

  cerrar(): void { this.dialogRef.close(); }
}
