import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { dateToString } from '../../../utils/date.utils';

interface FilaBalance {
  idMetodoPago: number | null;
  nombreMetodoPago: string;
  total: number;
  cantidad: number;
}

/**
 * Balance de caja de un día puntual: todo ingreso (ventas/abonos de
 * pedidos y cualquier otra categoría), discriminado por método de pago.
 * Por defecto muestra el día de hoy, con un selector para consultar otro
 * día -- independiente del filtro de rango que ya tiene Movimientos.
 */
@Component({
  selector: 'app-balance-dia-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './balance-dia-dialog.component.html',
  styleUrl: './balance-dia-dialog.component.css',
})
export class BalanceDiaDialogComponent implements OnInit {
  cargando = false;
  fecha = new Date();
  fechaStr = '';
  filas: FilaBalance[] = [];
  total = 0;

  constructor(
    private movimientoService: MovimientoService,
    public dialogRef: MatDialogRef<BalanceDiaDialogComponent>,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    const fechaParam = dateToString(this.fecha);
    this.movimientoService.balanceDia(fechaParam).subscribe({
      next: (r: any) => {
        this.fechaStr = r.fecha ?? fechaParam;
        this.filas = r.porMetodoPago ?? [];
        this.total = Number(r.total ?? 0);
        this.cargando = false;
      },
      error: () => { this.cargando = false; },
    });
  }

  cambiarDia(delta: number): void {
    const nueva = new Date(this.fecha);
    nueva.setDate(nueva.getDate() + delta);
    this.fecha = nueva;
    this.cargar();
  }

  hoy(): void {
    this.fecha = new Date();
    this.cargar();
  }

  esHoy(): boolean {
    const hoy = new Date();
    return this.fecha.toDateString() === hoy.toDateString();
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
