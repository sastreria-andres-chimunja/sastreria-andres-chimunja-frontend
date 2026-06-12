import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NominaService } from '../../../core/services/nomina.service';
import { ItemPedidoService } from '../../../core/services/item-pedido.service';

export interface NominaDetalleDialogData {
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  fechaInicio?: string;
  fechaFin?: string;
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

  constructor(
    public dialogRef: MatDialogRef<NominaDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NominaDetalleDialogData,
    private nominaService: NominaService,
    private itemPedidoService: ItemPedidoService,
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
    this.itemPedidoService.pagar(item.idItemPedido).subscribe({
      next: () => {
        this.pagandoId = null;
        this.cargarDetalle();
      },
      error: () => { this.pagandoId = null; },
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
