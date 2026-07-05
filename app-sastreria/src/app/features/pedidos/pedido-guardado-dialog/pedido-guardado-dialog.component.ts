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
  archivoPDF: File | null   = null;
  urlFallback: string | null = null;

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

  /** Paso 1: Genera el PDF en memoria (sin descargarlo). */
  async generarPDF(): Promise<void> {
    this.generandoPDF  = true;
    this.archivoPDF    = null;
    this.urlFallback   = null;
    try {
      this.archivoPDF = await this.reciboService.generarPDFBlob(this.reciboData);
    } finally {
      this.generandoPDF = false;
    }
  }

  /**
   * Paso 2: Envía el PDF por WhatsApp.
   * Primero intenta el envío 100% automático vía backend (Meta Cloud API,
   * sin abrir nada ni pedir adjuntar el archivo). Si el backend no está
   * configurado o falla, cae al método manual (Web Share en móvil, o
   * descargar + abrir WhatsApp Web en PC).
   */
  async enviarWhatsApp(): Promise<void> {
    if (!this.archivoPDF || !this.data.telefonoCliente) return;
    const texto = this.reciboService.generarTextoWhatsApp(this.reciboData);

    this.enviandoWhatsApp = true;
    try {
      await this.reciboService.enviarDocumentoViaBackend(this.archivoPDF, this.data.telefonoCliente, texto);
      Swal.fire({ title: '¡Enviado por WhatsApp!', icon: 'success', timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error('Envío automático por WhatsApp falló, usando método manual:', err);
      const url = await this.reciboService.compartirConWhatsApp(this.archivoPDF, this.data.telefonoCliente, texto);
      if (url) this.urlFallback = url;
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
