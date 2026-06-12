import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PedidoService } from '../../../core/services/pedido.service';
import { Pedido } from '../../../shared/models/Pedido';
import { dateToString } from '../../../utils/date.utils';

@Component({
  selector: 'app-pedidos-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './pedidos-list.component.html',
  styleUrl: './pedidos-list.component.css',
})
export class PedidosListComponent implements OnInit {
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  busqueda = '';
  filtroEstado: string | null = null;

  filtroFechaAbierto = false;
  filtroFechaActivo = false;
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);

  constructor(
    private pedidoService: PedidoService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    const inicio = this.fechaInicioCtrl.value ? dateToString(this.fechaInicioCtrl.value) : undefined;
    const fin = this.fechaFinCtrl.value ? dateToString(this.fechaFinCtrl.value) : undefined;
    this.pedidoService.listar(inicio, fin).subscribe((resp: any) => {
      this.pedidos = resp.pedidos;
      this.aplicarBusqueda();
    });
  }

  aplicarBusqueda(): void {
    let resultado = [...this.pedidos];

    // Texto
    const q = this.busqueda.toLowerCase().trim();
    if (q) {
      resultado = resultado.filter((p) =>
        (p.nombreCliente ?? '').toLowerCase().includes(q) ||
        String(p.idPedido).includes(q)
      );
    }

    // Estado/filtro de tarjeta
    if (this.filtroEstado) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      resultado = resultado.filter((p) => {
        const nombre = (p.nombreEstado ?? '').toLowerCase();
        switch (this.filtroEstado) {
          case 'pendiente':  return nombre.includes('pendiente');
          case 'asignado':   return nombre.includes('asignad');
          case 'terminado':  return nombre.includes('terminad');
          case 'entregado':  return this.esEntregado(p);
          case 'por-vencer': {
            if (this.esEntregado(p)) return false;
            const limite = new Date(hoy); limite.setDate(limite.getDate() + 7);
            const fe = this.parseFechaEntrega(p.fechaEntrega);
            return fe >= hoy && fe <= limite;
          }
          case 'vencido': {
            if (this.esEntregado(p)) return false;
            return this.parseFechaEntrega(p.fechaEntrega) < hoy;
          }
          default: return true;
        }
      });
    }

    this.pedidosFiltrados = resultado;
  }

  setFiltro(filtro: string | null): void {
    // Clic en Total o clic en el filtro ya activo → limpiar
    this.filtroEstado = (filtro === null || this.filtroEstado === filtro) ? null : filtro;
    this.aplicarBusqueda();
  }

  onBusqueda(event: Event): void {
    this.busqueda = (event.target as HTMLInputElement).value;
    this.aplicarBusqueda();
  }

  toggleFiltroFecha(): void { this.filtroFechaAbierto = !this.filtroFechaAbierto; }

  aplicarFiltroFecha(): void {
    this.filtroFechaActivo = !!(this.fechaInicioCtrl.value || this.fechaFinCtrl.value);
    this.filtroFechaAbierto = false;
    this.cargarPedidos();
  }

  limpiarFiltroFecha(): void {
    this.fechaInicioCtrl.reset();
    this.fechaFinCtrl.reset();
    this.filtroFechaActivo = false;
    this.filtroFechaAbierto = false;
    this.cargarPedidos();
  }

  irACrear(): void { this.router.navigate(['/app/pedidos/crear']); }
  irAEditar(p: Pedido): void { this.router.navigate(['/app/pedidos/editar', p.idPedido]); }

  // ── Resumen ────────────────────────────────────────────────
  get total(): number { return this.pedidos.length; }

  get pendientes(): number {
    return this.pedidos.filter(
      (p) => (p.nombreEstado ?? '').toLowerCase().includes('pendiente')
    ).length;
  }

  get asignados(): number {
    return this.pedidos.filter(
      (p) => (p.nombreEstado ?? '').toLowerCase().includes('asignad')
    ).length;
  }

  get terminados(): number {
    return this.pedidos.filter(
      (p) => (p.nombreEstado ?? '').toLowerCase().includes('terminad')
    ).length;
  }

  get porVencer(): number {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy); limite.setDate(limite.getDate() + 7);
    return this.pedidos.filter((p) => {
      if (this.esEntregado(p) || this.esCancelado(p)) return false;
      const fe = this.parseFechaEntrega(p.fechaEntrega);
      return fe >= hoy && fe <= limite;
    }).length;
  }

  get vencidos(): number {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return this.pedidos.filter((p) => {
      if (this.esEntregado(p) || this.esCancelado(p)) return false;
      return this.parseFechaEntrega(p.fechaEntrega) < hoy;
    }).length;
  }

  get entregados(): number {
    return this.pedidos.filter((p) => this.esEntregado(p)).length;
  }

  // ── Helpers ────────────────────────────────────────────────
  private esEntregado(p: Pedido): boolean {
    return (p.nombreEstado ?? '').toLowerCase().includes('entrega');
  }
  private esCancelado(p: Pedido): boolean {
    return (p.nombreEstado ?? '').toLowerCase().includes('cancel');
  }
  private parseFechaEntrega(fecha: string): Date {
    if (!fecha) return new Date(0);
    const [d, m, y] = fecha.split('/');
    return new Date(+y, +m - 1, +d);
  }

  diasRestantes(fechaEntrega: string): number {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fe = this.parseFechaEntrega(fechaEntrega);
    return Math.ceil((fe.getTime() - hoy.getTime()) / 86400000);
  }

  estadoClase(p: Pedido): string {
    if (this.esEntregado(p)) return 'entregado';
    if (this.esCancelado(p)) return 'cancelado';
    const nombre = (p.nombreEstado ?? '').toLowerCase();
    if (nombre.includes('terminad')) return 'terminado';
    if (nombre.includes('asignad'))  return 'asignado';
    const dias = this.diasRestantes(p.fechaEntrega);
    if (dias < 0) return 'vencido';
    if (dias <= 7) return 'por-vencer';
    return 'pendiente';
  }

  getInitials(nombre: string): string {
    return (nombre ?? '??')
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }
}
