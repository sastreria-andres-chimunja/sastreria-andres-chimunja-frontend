import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ItemPedidoService } from '../../core/services/item-pedido.service';
import { EmpleadoService } from '../../core/services/empleado.service';

@Component({
  selector: 'app-items-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
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
  filtroFecha = '';

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
    if (this.filtroFecha) {
      res = res.filter((i) => this.fechaAIso(i.fechaEntrega) === this.filtroFecha);
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

  /** Convierte "dd/mm/yyyy" (formato del backend) a "yyyy-mm-dd" (formato de <input type="date">). */
  private fechaAIso(fecha: string): string {
    const partes = (fecha ?? '').split('/');
    if (partes.length !== 3) return '';
    const [dia, mes, anio] = partes;
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = null;
    this.filtroEmpleado = '';
    this.filtroFecha = '';
    this.aplicarFiltro();
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
    return !!this.busqueda || !!this.filtroEstado || !!this.filtroEmpleado || !!this.filtroFecha;
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
