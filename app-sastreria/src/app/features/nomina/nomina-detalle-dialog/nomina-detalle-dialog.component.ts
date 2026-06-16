import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NominaService } from '../../../core/services/nomina.service';
import { ItemPedidoService } from '../../../core/services/item-pedido.service';
import { ReciboService } from '../../../core/services/recibo.service';

export interface NominaDetalleDialogData {
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  fechaInicio?: string;
  fechaFin?: string;
  soloLectura?: boolean;
}

@Component({
  selector: 'app-nomina-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
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
  ultimoItemPagado: any = null;

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

  cargarDetalle(): void {
    this.cargando = true;
    this.nominaService
      .nominaEmpleado(this.data.idEmpleado, this.data.fechaInicio, this.data.fechaFin)
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
    this.ultimoItemPagado = null;
    this.itemPedidoService.pagar(item.idItemPedido).subscribe({
      next: (resp: any) => {
        this.pagandoId = null;
        this.ultimoItemPagado = resp.item ?? item;
        this.cargarDetalle();
      },
      error: () => { this.pagandoId = null; },
    });
  }

  imprimirTicketNomina(): void {
    if (!this.ultimoItemPagado) return;
    const item = this.ultimoItemPagado;
    const valorEmpleado = Number(item.valorEmpleado ?? 0) || (Number(item.valor ?? 0) * Number(item.comisionEmpleado ?? 0) / 100);
    this.reciboService.imprimirNomina({
      idItemPedido: item.idItemPedido,
      idPedido: item.idPedido,
      nombreEmpleado: `${this.data.nombres} ${this.data.apellidos}`,
      telefonoEmpleado: this.data.telefono,
      descripcion: item.descripcion ?? '',
      valor: valorEmpleado,
      fechaPago: new Date().toLocaleDateString('es-CO'),
    });
  }

  enviarWhatsAppNomina(): void {
    if (!this.ultimoItemPagado) return;
    const item = this.ultimoItemPagado;
    const valorEmpleado = Number(item.valorEmpleado ?? 0) || (Number(item.valor ?? 0) * Number(item.comisionEmpleado ?? 0) / 100);
    this.reciboService.abrirWhatsAppNomina({
      idItemPedido: item.idItemPedido,
      idPedido: item.idPedido,
      nombreEmpleado: `${this.data.nombres} ${this.data.apellidos}`,
      telefonoEmpleado: this.data.telefono,
      descripcion: item.descripcion ?? '',
      valor: valorEmpleado,
      fechaPago: new Date().toLocaleDateString('es-CO'),
    }, this.data.telefono);
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
