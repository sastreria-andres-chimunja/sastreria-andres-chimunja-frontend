import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Movimiento } from '../../../shared/models/Movimiento';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { TipoMovimiento } from '../../../shared/models/TipoMovimiento';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CrearMovimientoComponent } from '../crear-movimiento/crear-movimiento.component';
import { dateToString } from '../../../utils/date.utils';

@Component({
  selector: 'app-movimientos-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTooltipModule,
  ],
  templateUrl: './movimientos-list.component.html',
  styleUrl: './movimientos-list.component.css',
})
export class MovimientosListComponent implements OnInit {
  tabActivo: 'Ingreso' | 'Salida' = 'Ingreso';
  busqueda: string = '';
  movimientos: Movimiento[] = [];
  isEmpty = false;
  tiposMovimiento: TipoMovimiento[] = [];

  filtroFechaAbierto = false;
  filtroFechaActivo = false;
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);

  constructor(
    private movimientoService: MovimientoService,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadTiposMovimiento();
    this.loadMovimientos();
  }

  loadMovimientos() {
    const inicio = this.fechaInicioCtrl.value
      ? dateToString(this.fechaInicioCtrl.value)
      : undefined;
    const fin = this.fechaFinCtrl.value
      ? dateToString(this.fechaFinCtrl.value)
      : undefined;
    this.movimientoService.listarMovimientos(inicio, fin).subscribe((resp: any) => {
      this.movimientos = resp.movimientos;
      this.isEmpty = resp.movimientos.length === 0;
    });
  }

  toggleFiltroFecha(): void {
    this.filtroFechaAbierto = !this.filtroFechaAbierto;
  }

  aplicarFiltroFecha(): void {
    this.filtroFechaActivo = !!(this.fechaInicioCtrl.value || this.fechaFinCtrl.value);
    this.filtroFechaAbierto = false;
    this.loadMovimientos();
  }

  limpiarFiltroFecha(): void {
    this.fechaInicioCtrl.reset();
    this.fechaFinCtrl.reset();
    this.filtroFechaActivo = false;
    this.filtroFechaAbierto = false;
    this.loadMovimientos();
  }

  openDialog(data?: Movimiento) {
    const dialogRef = this.dialog.open(CrearMovimientoComponent, {
      width: '500px',
      height: '700px',
      data: data == null ? {} : data,
    });
    dialogRef.afterClosed().subscribe(() => {
      this.loadMovimientos();
    });
  }

  loadTiposMovimiento() {
    this.tiposMovimiento.push({ idTipoMovimiento: 1, nombreTipoMovimiento: 'Ingreso' });
    this.tiposMovimiento.push({ idTipoMovimiento: 2, nombreTipoMovimiento: 'Salida' });
  }

  get movimientosFiltrados(): Movimiento[] {
    const tabIndex = this.tabActivo === 'Ingreso' ? 1 : 2;
    const lista = this.movimientos.filter((m) => m.idTipoMovimiento === tabIndex);
    if (!this.busqueda.trim()) return lista;
    const q = this.busqueda.toLowerCase();
    return lista.filter((m) => m.observacion.toLowerCase().includes(q));
  }

  get totalIngresos(): number {
    return this.movimientos
      .filter((m) => m.idTipoMovimiento === 1)
      .reduce((s, m) => s + Number(m.valor), 0);
  }

  get totalSalidas(): number {
    return this.movimientos
      .filter((m) => m.idTipoMovimiento === 2)
      .reduce((s, m) => s + Number(m.valor), 0);
  }

  get conteoIngresos(): number {
    return this.movimientos.filter((m) => m.idTipoMovimiento === 1).length;
  }

  get conteoSalidas(): number {
    return this.movimientos.filter((m) => m.idTipoMovimiento === 2).length;
  }

  cambiarTab(tab: 'Ingreso' | 'Salida'): void {
    this.tabActivo = tab;
  }

  formatCurrency(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  }
}
