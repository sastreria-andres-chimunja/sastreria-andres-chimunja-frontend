import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Movimiento } from '../../../shared/models/Movimiento';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CrearMovimientoComponent } from '../crear-movimiento/crear-movimiento.component';
import { dateToString } from '../../../utils/date.utils';

type TabCategoria = 'pedidos' | 'nomina' | 'gastos';

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
  tabActivo: TabCategoria = 'pedidos';
  busqueda = '';
  movimientos: Movimiento[] = [];

  private movsPedidos:  Movimiento[] = [];
  private movsNomina:   Movimiento[] = [];
  private movsGastos:   Movimiento[] = [];

  filtroFechaAbierto = false;
  filtroFechaActivo = false;
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);

  constructor(
    private movimientoService: MovimientoService,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadMovimientos();
  }

  loadMovimientos() {
    const inicio = this.fechaInicioCtrl.value ? dateToString(this.fechaInicioCtrl.value) : undefined;
    const fin    = this.fechaFinCtrl.value    ? dateToString(this.fechaFinCtrl.value)    : undefined;

    forkJoin({
      pedidos: this.movimientoService.listarMovimientos(inicio, fin, 'pedidos'),
      nomina:  this.movimientoService.listarMovimientos(inicio, fin, 'nomina'),
      gastos:  this.movimientoService.listarMovimientos(inicio, fin, 'gastos'),
    }).subscribe((resp: any) => {
      this.movsPedidos = resp.pedidos.movimientos ?? [];
      this.movsNomina  = resp.nomina.movimientos  ?? [];
      this.movsGastos  = resp.gastos.movimientos  ?? [];
      this.actualizarLista();
    });
  }

  private actualizarLista(): void {
    const map: Record<TabCategoria, Movimiento[]> = {
      pedidos: this.movsPedidos,
      nomina:  this.movsNomina,
      gastos:  this.movsGastos,
    };
    this.movimientos = map[this.tabActivo];
  }

  cambiarTab(tab: TabCategoria): void {
    this.tabActivo = tab;
    this.actualizarLista();
  }

  toggleFiltroFecha(): void { this.filtroFechaAbierto = !this.filtroFechaAbierto; }

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
      maxHeight: '90vh',
      data: data ?? {},
      panelClass: 'nomina-dialog-panel',
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe(() => this.loadMovimientos());
  }

  get movimientosFiltrados(): Movimiento[] {
    if (!this.busqueda.trim()) return this.movimientos;
    const q = this.busqueda.toLowerCase();
    return this.movimientos.filter((m) =>
      (m.observacion ?? '').toLowerCase().includes(q) ||
      ((m as any).nombreCategoriaMovimiento ?? '').toLowerCase().includes(q) ||
      ((m as any).nombreMetodoPago ?? '').toLowerCase().includes(q)
    );
  }

  get totalEntradas(): number {
    return this.movsPedidos
      .filter((m) => m.idTipoMovimiento === 1)
      .reduce((s, m) => s + Number(m.valor), 0);
  }

  get totalSalidas(): number {
    return [...this.movsNomina, ...this.movsGastos]
      .filter((m) => m.idTipoMovimiento === 2)
      .reduce((s, m) => s + Number(m.valor), 0);
  }

  get conteoMovimientos(): number { return this.movimientos.length; }

  tabLabel(tab: TabCategoria): string {
    const labels: Record<TabCategoria, string> = {
      pedidos: 'Pagos de pedidos',
      nomina: 'Nómina',
      gastos: 'Gastos',
    };
    return labels[tab];
  }

  tabIcon(tab: TabCategoria): string {
    const icons: Record<TabCategoria, string> = {
      pedidos: 'receipt_long',
      nomina: 'engineering',
      gastos: 'shopping_cart',
    };
    return icons[tab];
  }

  esEntrada(m: Movimiento): boolean { return m.idTipoMovimiento === 1; }

  formatCurrency(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0,
    }).format(valor ?? 0);
  }
}
