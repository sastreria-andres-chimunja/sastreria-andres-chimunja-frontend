import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PedidoService } from '../../../core/services/pedido.service';
import { MetodoPagoService } from '../../../core/services/metodos-pago.service';
import { ItemPedidoService } from '../../../core/services/item-pedido.service';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { Pedido } from '../../../shared/models/Pedido';
import { Empleado } from '../../../shared/models/Empleado';
import { dateToString } from '../../../utils/date.utils';
import { AuthService } from '../../../core/services/auth.service';
import { PagarItemDialogComponent, PagarItemDialogData } from '../pagar-item-dialog/pagar-item-dialog.component';
import {
  AsignarEmpleadoDialogComponent,
  AsignarEmpleadoDialogData,
} from '../asignar-empleado-dialog/asignar-empleado-dialog.component';

type TabTipoPedido = 'arreglo' | 'confeccion';

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
    PagarItemDialogComponent,
    AsignarEmpleadoDialogComponent,
  ],
  templateUrl: './pedidos-list.component.html',
  styleUrl: './pedidos-list.component.css',
})
export class PedidosListComponent implements OnInit {
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  busqueda = '';
  filtroEstado: string | null = null;
  tabTipo: TabTipoPedido = 'arreglo';

  filtroFechaAbierto = false;
  filtroFechaActivo = false;
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);

  metodosPago: any[] = [];
  empleados: Empleado[] = [];

  resumenVisible = true;
  toggleResumen(): void { this.resumenVisible = !this.resumenVisible; }

  constructor(
    private pedidoService: PedidoService,
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog,
    private metodoPagoService: MetodoPagoService,
    private itemPedidoService: ItemPedidoService,
    private empleadoService: EmpleadoService,
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
    this.metodoPagoService.listarMetodosPago().subscribe((r: any) => {
      this.metodosPago = r.metodosPago ?? [];
    });
    this.empleadoService.getAll().subscribe((r: any) => {
      this.empleados = r.empleados ?? [];
    });
  }

  // Operario solo ve los pedidos donde tiene ítems asignados
  get idEmpleadoFiltro(): number | undefined {
    return this.authService.esOperario()
      ? (this.authService.getIdEmpleado() ?? undefined)
      : undefined;
  }

  get puedeCrearPedido(): boolean {
    return !this.authService.esOperario();
  }

  cargarPedidos(): void {
    const inicio = this.fechaInicioCtrl.value ? dateToString(this.fechaInicioCtrl.value) : undefined;
    const fin = this.fechaFinCtrl.value ? dateToString(this.fechaFinCtrl.value) : undefined;
    this.pedidoService.listar(inicio, fin, this.idEmpleadoFiltro).subscribe((resp: any) => {
      this.pedidos = resp.pedidos;
      this.aplicarBusqueda();
    });
  }

  // ── Tab tipo de pedido ────────────────────────────────────────
  get pedidosDelTab(): Pedido[] {
    return this.pedidos.filter((p) => this.perteneceATab(p, this.tabTipo));
  }

  get countTabArreglo(): number {
    return this.pedidos.filter((p) => this.perteneceATab(p, 'arreglo')).length;
  }

  get countTabConfeccion(): number {
    return this.pedidos.filter((p) => this.perteneceATab(p, 'confeccion')).length;
  }

  cambiarTab(tab: TabTipoPedido): void {
    this.tabTipo = tab;
    this.filtroEstado = null;
    this.aplicarBusqueda();
  }

  private perteneceATab(p: Pedido, tab: TabTipoPedido): boolean {
    const nombre = (p.nombreTipoPedido ?? '').toLowerCase();
    return tab === 'arreglo' ? nombre.includes('arreglo') : nombre.includes('confecci');
  }

  aplicarBusqueda(): void {
    let resultado = [...this.pedidosDelTab];

    // Los pedidos "No realizado" quedan ocultos salvo que se active ese filtro a propósito
    if (this.filtroEstado !== 'no-realizado') {
      resultado = resultado.filter((p) => !this.esNoRealizado(p));
    }

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
          case 'no-realizado': return this.esNoRealizado(p);
          case 'por-vencer': {
            if (this.esEntregado(p) || this.esTerminado(p)) return false;
            const limite = new Date(hoy); limite.setDate(limite.getDate() + 7);
            const fe = this.parseFechaEntrega(p.fechaEntrega);
            return fe >= hoy && fe <= limite;
          }
          case 'vencido': {
            if (this.esEntregado(p) || this.esTerminado(p)) return false;
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

  irACrear(): void { this.router.navigate(['/app/pedidos/crear'], { queryParams: { tipo: this.tabTipo } }); }
  irAEditar(p: Pedido): void { this.router.navigate(['/app/pedidos/editar', p.idPedido]); }

  abrirDialogoPago(p: Pedido, event: Event): void {
    event.stopPropagation();
    this.itemPedidoService.listarPorPedido(p.idPedido!).subscribe((r: any) => {
      const items = (r.items ?? []).map((it: any) => ({
        descripcion: String(it.descripcion ?? ''),
        valor: Number(it.valor ?? 0),
      }));
      const data: PagarItemDialogData = {
        idPedido:         p.idPedido!,
        valorTotalPedido: p.valorTotal ?? 0,
        nombreCliente:    p.nombreCliente ?? '',
        telefonoCliente:  p.telefonoCliente,
        metodosPago:      this.metodosPago,
        items,
        fechaEntrega:     p.fechaEntrega ?? undefined,
      };
      this.dialog.open(PagarItemDialogComponent, {
        data,
        maxWidth:   '95vw',
        maxHeight:  '92vh',
        panelClass: 'nomina-dialog-panel',
        autoFocus:  false,
      });
    });
  }

  abrirDialogoAsignar(p: Pedido, event: Event): void {
    event.stopPropagation();
    this.itemPedidoService.listarPorPedido(p.idPedido!).subscribe((r: any) => {
      const items = (r.items ?? []).map((it: any) => ({
        idItemPedido: it.idItemPedido,
        descripcion: String(it.descripcion ?? ''),
      }));
      const data: AsignarEmpleadoDialogData = {
        idPedido: p.idPedido!,
        nombreCliente: p.nombreCliente ?? '',
        items,
        empleados: this.empleados,
      };
      const ref = this.dialog.open(AsignarEmpleadoDialogComponent, {
        data,
        maxWidth: '95vw',
        maxHeight: '92vh',
        autoFocus: false,
      });
      ref.afterClosed().subscribe((asignado) => {
        if (asignado) this.cargarPedidos();
      });
    });
  }

  // ── Resumen (dentro del tab activo) ─────────────────────────
  get total(): number {
    return this.pedidosDelTab.filter((p) => !this.esNoRealizado(p)).length;
  }

  get noRealizados(): number {
    return this.pedidosDelTab.filter((p) => this.esNoRealizado(p)).length;
  }

  get pendientes(): number {
    return this.pedidosDelTab.filter(
      (p) => (p.nombreEstado ?? '').toLowerCase().includes('pendiente')
    ).length;
  }

  get asignados(): number {
    return this.pedidosDelTab.filter(
      (p) => (p.nombreEstado ?? '').toLowerCase().includes('asignad')
    ).length;
  }

  get terminados(): number {
    return this.pedidosDelTab.filter(
      (p) => (p.nombreEstado ?? '').toLowerCase().includes('terminad')
    ).length;
  }

  get porVencer(): number {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy); limite.setDate(limite.getDate() + 7);
    return this.pedidosDelTab.filter((p) => {
      if (this.esEntregado(p) || this.esCancelado(p) || this.esTerminado(p) || this.esNoRealizado(p)) return false;
      const fe = this.parseFechaEntrega(p.fechaEntrega);
      return fe >= hoy && fe <= limite;
    }).length;
  }

  get vencidos(): number {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return this.pedidosDelTab.filter((p) => {
      if (this.esEntregado(p) || this.esCancelado(p) || this.esTerminado(p) || this.esNoRealizado(p)) return false;
      return this.parseFechaEntrega(p.fechaEntrega) < hoy;
    }).length;
  }

  get entregados(): number {
    return this.pedidosDelTab.filter((p) => this.esEntregado(p)).length;
  }

  /** Suma del valor total de los pedidos que están visibles con el filtro/búsqueda/tab actual. */
  get valorTotalListado(): number {
    return this.pedidosFiltrados.reduce((acc, p) => acc + Number(p.valorTotal ?? 0), 0);
  }

  // ── Helpers ────────────────────────────────────────────────
  private esEntregado(p: Pedido): boolean {
    return (p.nombreEstado ?? '').toLowerCase().includes('entrega');
  }
  private esCancelado(p: Pedido): boolean {
    return (p.nombreEstado ?? '').toLowerCase().includes('cancel');
  }
  private esTerminado(p: Pedido): boolean {
    return (p.nombreEstado ?? '').toLowerCase().includes('terminad');
  }
  private esNoRealizado(p: Pedido): boolean {
    return (p.nombreEstado ?? '').toLowerCase() === 'no realizado';
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
    if (this.esNoRealizado(p)) return 'no-realizado';
    const nombre = (p.nombreEstado ?? '').toLowerCase();
    if (nombre.includes('terminad')) return 'terminado';
    if (nombre.includes('asignad'))  return 'asignado';
    const dias = this.diasRestantes(p.fechaEntrega);
    if (dias < 0) return 'vencido';
    if (dias <= 7) return 'por-vencer';
    return 'pendiente';
  }

  saldoPedido(p: Pedido): number {
    return Number(p.valorTotal ?? 0) - Number(p.totalAbonado ?? 0);
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
