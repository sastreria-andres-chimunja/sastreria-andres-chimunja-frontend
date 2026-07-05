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
import Swal from 'sweetalert2';

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
  archivoPDFNomina: File | null = null;
  generandoPDFNomina = false;
  enviandoWhatsAppNomina = false;
  urlFallbackNomina: string | null = null;

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
    this.archivoPDFNomina   = null;
    this.urlFallbackNomina  = null;
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

  async generarPDFNomina(): Promise<void> {
    this.generandoPDFNomina = true;
    this.archivoPDFNomina   = null;
    this.urlFallbackNomina  = null;
    try {
      this.archivoPDFNomina = await this.reciboService.generarPDFBlobNomina(this.nominaReciboData);
    } finally {
      this.generandoPDFNomina = false;
    }
  }

  async enviarWhatsAppNomina(): Promise<void> {
    if (!this.archivoPDFNomina || !this.data.telefono) return;
    const texto = this.reciboService.generarTextoWhatsAppNomina(this.nominaReciboData);

    this.enviandoWhatsAppNomina = true;
    try {
      await this.reciboService.enviarDocumentoViaBackend(this.archivoPDFNomina, this.data.telefono, texto);
      Swal.fire({ title: '¡Enviado por WhatsApp!', icon: 'success', timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error('Envío automático por WhatsApp falló, usando método manual:', err);
      const url = await this.reciboService.compartirConWhatsApp(this.archivoPDFNomina, this.data.telefono, texto);
      if (url) this.urlFallbackNomina = url;
    } finally {
      this.enviandoWhatsAppNomina = false;
    }
  }

  abrirWhatsAppFallbackNomina(): void {
    if (this.urlFallbackNomina) window.open(this.urlFallbackNomina, '_blank');
  }

  pagarTodo(): void {
    const pendientes = this.detalle?.entradas?.items ?? [];
    if (pendientes.length === 0) return;
    this.pagandoTodo       = true;
    this.ultimoItemPagado  = null;
    this.archivoPDFNomina  = null;
    this.urlFallbackNomina = null;

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
