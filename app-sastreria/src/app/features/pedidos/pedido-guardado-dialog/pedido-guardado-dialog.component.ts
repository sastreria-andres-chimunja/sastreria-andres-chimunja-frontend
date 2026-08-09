import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReciboService } from '../../../core/services/recibo.service';

export interface PedidoGuardadoDialogData {
  idPedido: number;
  nombreCliente: string;
  telefonoCliente?: string;
  valorTotal: number;
  valorAbono: number;
  totalPagado: number;
  nombreMetodoPago?: string;
  fechaEntrega?: string;
  items?: { descripcion: string; valor: number }[];
  tokenPublico?: string;
}

@Component({
  selector: 'app-pedido-guardado-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pedido-guardado-dialog.component.html',
  styleUrl: './pedido-guardado-dialog.component.css',
})
export class PedidoGuardadoDialogComponent implements OnInit {
  generandoPDF = false;
  enviandoWhatsApp = false;
  avisoPegarImagen = false;
  avisoAdjuntarImagen = false;

  // Se genera apenas se abre el diálogo (no al hacer clic en "Enviar a
  // WhatsApp") — compartir/copiar al portapapeles solo funciona si el
  // navegador todavía considera "reciente" el clic del usuario, y generar
  // la imagen (más al usar el <iframe> para aislar el layout) puede tardar
  // lo suficiente como para perder esa ventana. Precalculándola desde el
  // inicio, para cuando el usuario haga clic la imagen casi siempre ya
  // está lista y el compartir/copiar dispara de inmediato.
  private imagenPromise?: Promise<File>;

  constructor(
    public dialogRef: MatDialogRef<PedidoGuardadoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PedidoGuardadoDialogData,
    private reciboService: ReciboService,
  ) {}

  ngOnInit(): void {
    this.imagenPromise = this.reciboService.generarImagenBlob(this.reciboData);
  }

  private get reciboData() {
    return {
      idPedido:          this.data.idPedido,
      idItemPedido:      0,
      nombreCliente:     this.data.nombreCliente,
      telefonoCliente:   this.data.telefonoCliente,
      valorTotalPedido:  this.data.valorTotal,
      valorAbono:        this.data.valorAbono,
      totalPagadoPedido: this.data.totalPagado,
      metodoPago:        this.data.nombreMetodoPago,
      fechaPago:         new Date().toLocaleDateString('es-CO'),
      fechaEntrega:      this.data.fechaEntrega,
      items:             this.data.items,
      tokenPublico:      this.data.tokenPublico,
    };
  }

  imprimir(): void {
    this.reciboService.imprimir(this.reciboData);
  }

  imprimirTicket(): void {
    this.reciboService.imprimirTicket(this.reciboData);
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
   * (se ve grande de inmediato en el chat, como un comprobante bancario, sin
   * abrir un PDF). Siempre usa el método manual (copiar al portapapeles +
   * abrir el chat del cliente, o compartir nativo en celular si el
   * portapapeles no está disponible) — el envío 100% automático vía backend
   * (Meta Cloud API) se desactivó a propósito: ese envío sale desde el
   * número nuevo registrado en la API, no desde el número que ya conocen
   * los clientes.
   */
  async enviarWhatsApp(): Promise<void> {
    if (!this.data.telefonoCliente) return;
    const texto = this.reciboService.generarTextoWhatsApp(this.reciboData);

    this.enviandoWhatsApp = true;
    this.avisoPegarImagen = false;
    this.avisoAdjuntarImagen = false;
    try {
      // Si por algo no se alcanzó a precalcular en ngOnInit (o falló),
      // se genera aquí como respaldo — más lento, pero mejor que fallar.
      const imagen = await (this.imagenPromise ?? this.reciboService.generarImagenBlob(this.reciboData));
      const resultado = await this.reciboService.compartirConWhatsApp(imagen, this.data.telefonoCliente, texto);
      if (resultado === '_clipboard_') this.avisoPegarImagen = true;
      else this.avisoAdjuntarImagen = true;
    } finally {
      this.enviandoWhatsApp = false;
    }
  }

  aceptar(): void { this.dialogRef.close(true); }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
