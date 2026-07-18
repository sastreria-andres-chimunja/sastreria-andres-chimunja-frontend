import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReciboService } from '../../../core/services/recibo.service';
import Swal from 'sweetalert2';

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
}

@Component({
  selector: 'app-pedido-guardado-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pedido-guardado-dialog.component.html',
  styleUrl: './pedido-guardado-dialog.component.css',
})
export class PedidoGuardadoDialogComponent {
  generandoPDF = false;
  enviandoWhatsApp = false;
  urlFallback: string | null = null;
  avisoPegarImagen = false;

  constructor(
    public dialogRef: MatDialogRef<PedidoGuardadoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PedidoGuardadoDialogData,
    private reciboService: ReciboService,
  ) {}

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
   * Genera una imagen del recibo y la envía por WhatsApp (se ve grande de
   * inmediato en el chat, como un comprobante bancario, sin abrir un PDF).
   * Primero intenta el envío 100% automático vía backend (Meta Cloud API,
   * sin abrir nada ni pedir adjuntar el archivo). Si el backend no está
   * configurado o falla, cae al método manual (Web Share en móvil, o
   * copiar al portapapeles + abrir WhatsApp Web en PC).
   */
  async enviarWhatsApp(): Promise<void> {
    if (!this.data.telefonoCliente) return;
    const texto = this.reciboService.generarTextoWhatsApp(this.reciboData);

    this.enviandoWhatsApp = true;
    this.urlFallback = null;
    this.avisoPegarImagen = false;
    try {
      const imagen = await this.reciboService.generarImagenBlob(this.reciboData);
      try {
        await this.reciboService.enviarViaBackend(imagen, this.data.telefonoCliente, texto);
        Swal.fire({ title: '¡Enviado por WhatsApp!', icon: 'success', timer: 1800, showConfirmButton: false });
      } catch (err) {
        console.error('Envío automático por WhatsApp falló, usando método manual:', err);
        const resultado = await this.reciboService.compartirConWhatsApp(imagen, this.data.telefonoCliente, texto);
        if (resultado === '_clipboard_') this.avisoPegarImagen = true;
        else if (resultado) this.urlFallback = resultado;
      }
    } finally {
      this.enviandoWhatsApp = false;
    }
  }

  /** Solo en PC (fallback): abre WhatsApp Web tras haber descargado el PDF. */
  abrirWhatsAppFallback(): void {
    if (this.urlFallback) window.open(this.urlFallback, '_blank');
  }

  aceptar(): void { this.dialogRef.close(true); }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
