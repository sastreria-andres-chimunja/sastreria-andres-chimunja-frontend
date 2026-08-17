import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ItemPedidoService } from '../../core/services/item-pedido.service';
import { EmpleadoService } from '../../core/services/empleado.service';
import { stringToDate } from '../../utils/date.utils';

@Component({
  selector: 'app-items-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  templateUrl: './items-admin.component.html',
  styleUrl: './items-admin.component.css',
})
export class ItemsAdminComponent implements OnInit {
  items: any[] = [];
  itemsFiltrados: any[] = [];
  cargando = false;
  busqueda = '';
  filtroEstado: 'pendiente' | 'asignado' | 'terminado' | 'entregado' | null = null;

  empleados: any[] = [];
  filtroEmpleado: string = '';

  // Filtro por rango de fecha de entrega (calendario, mismo patrón que
  // pedidos-list/movimientos-list/nomina-general) — reemplaza el antiguo
  // <input type="date"> de fecha exacta.
  filtroFechaAbierto = false;
  filtroFechaActivo = false;
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);

  resumenVisible = true;
  toggleResumen(): void { this.resumenVisible = !this.resumenVisible; }

  constructor(
    private itemPedidoService: ItemPedidoService,
    private empleadoService: EmpleadoService,
  ) {}

  ngOnInit(): void {
    this.cargarItems();
    this.empleadoService.getAll().subscribe((r: any) => {
      this.empleados = r.empleados ?? [];
    });
  }

  cargarItems(): void {
    this.cargando = true;
    this.itemPedidoService.listarTodos().subscribe({
      next: (r: any) => {
        this.items = r.items ?? [];
        this.aplicarFiltro();
        this.cargando = false;
      },
      error: () => { this.cargando = false; },
    });
  }

  aplicarFiltro(): void {
    let res = [...this.items];
    const q = this.busqueda.toLowerCase().trim();
    if (q) {
      res = res.filter(
        (i) =>
          (i.descripcion ?? '').toLowerCase().includes(q) ||
          (i.nombreCliente ?? '').toLowerCase().includes(q) ||
          (i.nombreEmpleado ?? '').toLowerCase().includes(q) ||
          String(i.idPedido).includes(q),
      );
    }
    if (this.filtroEstado) {
      res = res.filter((i) => this.estadoClase(i) === this.filtroEstado);
    }
    if (this.filtroEmpleado === 'sin-asignar') {
      res = res.filter((i) => !i.idEmpleado);
    } else if (this.filtroEmpleado) {
      res = res.filter((i) => String(i.idEmpleado) === this.filtroEmpleado);
    }
    if (this.fechaInicioCtrl.value || this.fechaFinCtrl.value) {
      const desde = this.inicioDelDia(this.fechaInicioCtrl.value);
      const hasta = this.finDelDia(this.fechaFinCtrl.value);
      res = res.filter((i) => {
        const f = stringToDate(i.fechaEntrega);
        if (!f) return false;
        if (desde && f < desde) return false;
        if (hasta && f > hasta) return false;
        return true;
      });
    }
    this.itemsFiltrados = res;
  }

  onBusqueda(event: Event): void {
    this.busqueda = (event.target as HTMLInputElement).value;
    this.aplicarFiltro();
  }

  setFiltro(estado: 'pendiente' | 'asignado' | 'terminado' | 'entregado' | null): void {
    this.filtroEstado = this.filtroEstado === estado ? null : estado;
    this.aplicarFiltro();
  }

  private inicioDelDia(fecha: Date | null): Date | null {
    if (!fecha) return null;
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);
  }

  private finDelDia(fecha: Date | null): Date | null {
    if (!fecha) return null;
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999);
  }

  toggleFiltroFecha(): void {
    this.filtroFechaAbierto = !this.filtroFechaAbierto;
  }

  aplicarFiltroFecha(): void {
    this.filtroFechaActivo = !!(this.fechaInicioCtrl.value || this.fechaFinCtrl.value);
    this.filtroFechaAbierto = false;
    this.aplicarFiltro();
  }

  /** Atajo: filtra por la fecha de hoy (desde y hasta = hoy). */
  filtrarHoy(): void {
    const hoy = new Date();
    this.fechaInicioCtrl.setValue(hoy);
    this.fechaFinCtrl.setValue(hoy);
    this.aplicarFiltroFecha();
  }

  limpiarFiltroFecha(): void {
    this.fechaInicioCtrl.reset();
    this.fechaFinCtrl.reset();
    this.filtroFechaActivo = false;
    this.filtroFechaAbierto = false;
    this.aplicarFiltro();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = null;
    this.filtroEmpleado = '';
    this.limpiarFiltroFecha();
  }

  estadoClase(item: any): 'pendiente' | 'asignado' | 'terminado' | 'entregado' | 'no-realizado' {
    const n = (item.nombreEstado ?? '').toLowerCase();
    if (n.includes('no realizado')) return 'no-realizado';
    if (n.includes('entrega')) return 'entregado';
    if (n.includes('terminad')) return 'terminado';
    if (n.includes('asignad')) return 'asignado';
    return 'pendiente';
  }

  get hayFiltrosActivos(): boolean {
    return !!this.busqueda || !!this.filtroEstado || !!this.filtroEmpleado || this.filtroFechaActivo;
  }

  // ── Resumen ──────────────────────────────────────────────────
  get totalItems(): number { return this.items.length; }
  get countPendientes(): number { return this.items.filter((i) => this.estadoClase(i) === 'pendiente').length; }
  get countAsignados(): number { return this.items.filter((i) => this.estadoClase(i) === 'asignado').length; }
  get countTerminados(): number { return this.items.filter((i) => this.estadoClase(i) === 'terminado').length; }
  get countEntregados(): number { return this.items.filter((i) => this.estadoClase(i) === 'entregado').length; }

  formatFecha(fecha: string): string {
    return fecha || '—';
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }
}
