import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ItemPedidoService } from '../../core/services/item-pedido.service';

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

  constructor(private itemPedidoService: ItemPedidoService) {}

  ngOnInit(): void {
    this.cargarItems();
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

  estadoClase(item: any): 'pendiente' | 'asignado' | 'terminado' | 'entregado' | 'no-realizado' {
    const n = (item.nombreEstado ?? '').toLowerCase();
    if (n.includes('no realizado')) return 'no-realizado';
    if (n.includes('entrega')) return 'entregado';
    if (n.includes('terminad')) return 'terminado';
    if (n.includes('asignad')) return 'asignado';
    return 'pendiente';
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
