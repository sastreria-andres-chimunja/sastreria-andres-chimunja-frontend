import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ItemPedidoService } from '../../core/services/item-pedido.service';
import { EstadoService } from '../../core/services/estado.service';
import { AuthService } from '../../core/services/auth.service';
import { ReciboService } from '../../core/services/recibo.service';
import { ImagenService } from '../../core/services/imagen.service';
import { stringToDate } from '../../utils/date.utils';

export interface GrupoPedido {
  idPedido: number;
  nombreCliente: string;
  fechaEntrega: string;
  items: any[];
}

@Component({
  selector: 'app-mis-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  templateUrl: './mis-items.component.html',
  styleUrl: './mis-items.component.css',
})
export class MisItemsComponent implements OnInit {
  items: any[] = [];
  itemsFiltrados: any[] = [];
  gruposFiltrados: GrupoPedido[] = [];
  cargando = false;
  busqueda = '';
  filtroEstado: 'asignado' | 'terminado' | null = null;

  cambioEstadoId: number | null = null;

  // Filtro por rango de fecha de entrega (calendario, mismo patrón que
  // items-admin/pedidos-list/movimientos-list/nomina-general).
  filtroFechaAbierto = false;
  filtroFechaActivo = false;
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);

  // Pedidos que el empleado abrió manualmente (fuera de eso, quedan
  // agrupados/colapsados por defecto para no saturar la vista con varios
  // ítems del mismo pedido repetidos como tarjetas sueltas).
  private pedidosExpandidos = new Set<number>();

  private idEstadoAsignado: number | null = null;
  private idEstadoTerminado: number | null = null;

  // Detalle del ítem (foto + descripción/datos): ítem actualmente abierto en
  // el overlay de "Ver detalle" (null = cerrado)
  itemDetalle: any | null = null;
  // Ampliar foto SOLA, sin descripción -- se abre al tocar una miniatura
  // (tanto desde la tarjeta como desde dentro del overlay de detalle, donde
  // queda apilada encima). Comparte fotoActivaIdx con itemDetalle para que,
  // si se abrió desde ahí, al cerrarla se siga viendo la misma foto.
  fotoGaleria: any | null = null;
  fotoActivaIdx = 0;

  constructor(
    private authService: AuthService,
    private itemPedidoService: ItemPedidoService,
    private estadoService: EstadoService,
    private reciboService: ReciboService,
    private imagenService: ImagenService,
  ) {}

  ngOnInit(): void {
    this.estadoService.listar().subscribe({
      next: (res: any) => {
        const estados: any[] = Array.isArray(res) ? res : (res?.estados ?? []);
        const asignado = estados.find((e) => e.nombre.toLowerCase().includes('asignad'));
        const terminado = estados.find((e) => e.nombre.toLowerCase() === 'terminado');
        this.idEstadoAsignado = asignado?.idEstado ?? null;
        this.idEstadoTerminado = terminado?.idEstado ?? null;
        this.cargarItems();
      },
      error: () => this.cargarItems(),
    });
  }

  cargarItems(): void {
    const idEmpleado = this.authService.getIdEmpleado();
    if (!idEmpleado) return;
    this.cargando = true;
    this.itemPedidoService.listarPorEmpleado(idEmpleado).subscribe({
      next: (r: any) => {
        // Excluir Pendiente (no deberían llegar, pero por seguridad)
        this.items = (r.items ?? []).filter(
          (i: any) => !(i.nombreEstado ?? '').toLowerCase().includes('pendiente'),
        );
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
          String(i.idPedido).includes(q),
      );
    }
    if (this.filtroEstado) {
      res = res.filter((i) =>
        (i.nombreEstado ?? '').toLowerCase().includes(this.filtroEstado!),
      );
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
    this.gruposFiltrados = this.agruparPorPedido(res);
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

  /** Agrupa la lista de ítems por pedido, conservando el orden de aparición. */
  private agruparPorPedido(lista: any[]): GrupoPedido[] {
    const mapa = new Map<number, GrupoPedido>();
    for (const item of lista) {
      let grupo = mapa.get(item.idPedido);
      if (!grupo) {
        grupo = {
          idPedido: item.idPedido,
          nombreCliente: item.nombreCliente,
          fechaEntrega: item.fechaEntrega,
          items: [],
        };
        mapa.set(item.idPedido, grupo);
      }
      grupo.items.push(item);
    }
    return Array.from(mapa.values());
  }

  onBusqueda(event: Event): void {
    this.busqueda = (event.target as HTMLInputElement).value;
    this.aplicarFiltro();
  }

  setFiltro(estado: 'asignado' | 'terminado' | null): void {
    this.filtroEstado = this.filtroEstado === estado ? null : estado;
    this.aplicarFiltro();
  }

  /**
   * Colapsado por defecto para no saturar la vista con varios ítems del
   * mismo pedido como tarjetas sueltas; al buscar, los grupos con
   * resultados se muestran expandidos automáticamente para no esconder lo
   * que el empleado está buscando.
   */
  estaExpandido(idPedido: number): boolean {
    return this.pedidosExpandidos.has(idPedido) || !!this.busqueda.trim();
  }

  toggleGrupo(idPedido: number): void {
    if (this.pedidosExpandidos.has(idPedido)) this.pedidosExpandidos.delete(idPedido);
    else this.pedidosExpandidos.add(idPedido);
  }

  totalGrupo(grupo: GrupoPedido): number {
    return grupo.items.reduce((s, i) => s + Number(i.valor ?? 0), 0);
  }

  esAsignado(item: any): boolean {
    return (item.nombreEstado ?? '').toLowerCase().includes('asignad');
  }

  esTerminado(item: any): boolean {
    return (item.nombreEstado ?? '').toLowerCase().includes('terminad');
  }

  marcarTerminado(item: any): void {
    if (!this.idEstadoTerminado) return;
    this.cambiarEstado(item, this.idEstadoTerminado, 'Terminado');
  }

  reabrir(item: any): void {
    if (!this.idEstadoAsignado) return;
    this.cambiarEstado(item, this.idEstadoAsignado, 'Asignado');
  }

  private cambiarEstado(item: any, idEstado: number, nombreEstado: string): void {
    this.cambioEstadoId = item.idItemPedido;
    this.itemPedidoService.actualizarEstado(item.idItemPedido, idEstado).subscribe({
      next: (r: any) => {
        item.idEstado = r.item?.idEstado ?? idEstado;
        item.nombreEstado = r.item?.nombreEstado ?? nombreEstado;
        this.cambioEstadoId = null;
        this.aplicarFiltro();
      },
      error: () => { this.cambioEstadoId = null; },
    });
  }

  /** Avisa por WhatsApp al cliente que su prenda (este ítem puntual) ya está lista. */
  enviarRecordatorioItem(item: any): void {
    if (!item.telefonoCliente) return;
    const texto =
      `*SASTRERÍA ANDRÉS CHIMUNJA*\n` +
      `La prenda que tienes como prioridad en sastrería ya está lista.`;
    this.reciboService.abrirChatWhatsAppTexto(item.telefonoCliente, texto);
  }

  // ── Resumen ──────────────────────────────────────────────────
  get totalItems(): number { return this.items.length; }
  get countAsignados(): number {
    return this.items.filter((i) => this.esAsignado(i)).length;
  }
  get countTerminados(): number {
    return this.items.filter((i) => this.esTerminado(i)).length;
  }

  /**
   * Valor de lo que el empleado ha terminado (fechaTerminado, no fechaEntrega)
   * hoy, o en la fecha/rango seleccionado en el filtro de arriba si hay uno
   * activo -- reutiliza el mismo filtro de fecha del listado (aunque ese
   * filtra la lista por fechaEntrega) para no duplicar otro selector aparte.
   */
  private get rangoParaValorTerminado(): { desde: Date | null; hasta: Date | null } {
    if (this.filtroFechaActivo && (this.fechaInicioCtrl.value || this.fechaFinCtrl.value)) {
      return {
        desde: this.fechaInicioCtrl.value ? this.inicioDelDia(this.fechaInicioCtrl.value) : null,
        hasta: this.fechaFinCtrl.value ? this.finDelDia(this.fechaFinCtrl.value) : null,
      };
    }
    const hoy = new Date();
    return { desde: this.inicioDelDia(hoy), hasta: this.finDelDia(hoy) };
  }

  get valorTerminadoPeriodo(): number {
    const { desde, hasta } = this.rangoParaValorTerminado;
    return this.items
      .filter((i) => {
        if (!i.fechaTerminado) return false;
        const f = new Date(i.fechaTerminado);
        if (desde && f < desde) return false;
        if (hasta && f > hasta) return false;
        return true;
      })
      .reduce((s, i) => s + Number(i.valor ?? 0), 0);
  }

  get etiquetaValorTerminado(): string {
    return this.filtroFechaActivo && (this.fechaInicioCtrl.value || this.fechaFinCtrl.value)
      ? 'Terminado en el rango'
      : 'Terminado hoy';
  }

  /** Lo que el empleado GANÓ (comisión, no el valor completo del ítem) en
   * el mismo período que valorTerminadoPeriodo -- misma fecha de referencia
   * (fechaTerminado), solo cambia qué se suma. */
  get ganadoPeriodo(): number {
    const { desde, hasta } = this.rangoParaValorTerminado;
    return this.items
      .filter((i) => {
        if (!i.fechaTerminado) return false;
        const f = new Date(i.fechaTerminado);
        if (desde && f < desde) return false;
        if (hasta && f > hasta) return false;
        return true;
      })
      .reduce((s, i) => s + Number(i.valor ?? 0) * Number(i.comisionEmpleado ?? 0) / 100, 0);
  }

  get etiquetaGanado(): string {
    return this.filtroFechaActivo && (this.fechaInicioCtrl.value || this.fechaFinCtrl.value)
      ? 'Ganado en el rango'
      : 'Ganado hoy';
  }

  estadoClase(item: any): string {
    const n = (item.nombreEstado ?? '').toLowerCase();
    if (n.includes('terminad')) return 'terminado';
    if (n.includes('entrega')) return 'entregado';
    return 'asignado';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '—';
    return fecha;
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }

  nombreUsuario(): string {
    const s = this.authService.getSesion();
    return s ? `${s.nombres}` : '';
  }

  // ── Detalle del ítem / ampliar foto ─────────────────────────────
  getImageUrl(ruta: string): string {
    return this.imagenService.getUrl(ruta);
  }

  abrirDetalle(item: any, idxFoto = 0): void {
    this.itemDetalle = item;
    this.fotoActivaIdx = idxFoto;
  }

  cerrarDetalle(): void {
    this.itemDetalle = null;
    this.fotoActivaIdx = 0;
  }

  /** Abre la foto sola (sin descripción), lo más grande posible. */
  abrirGaleria(item: any, idxFoto = 0): void {
    if (!item?.fotos?.length) return;
    this.fotoGaleria = item;
    this.fotoActivaIdx = idxFoto;
  }

  cerrarGaleria(): void {
    this.fotoGaleria = null;
  }

  /** El ítem cuyas fotos se están navegando en este momento -- la galería
   * (si está abierta encima de todo) tiene prioridad sobre el detalle. */
  private get itemFotosActivo(): any | null {
    return this.fotoGaleria ?? this.itemDetalle;
  }

  fotoAnterior(event: Event): void {
    event.stopPropagation();
    const item = this.itemFotosActivo;
    if (!item?.fotos?.length) return;
    this.fotoActivaIdx = (this.fotoActivaIdx - 1 + item.fotos.length) % item.fotos.length;
  }

  fotoSiguiente(event: Event): void {
    event.stopPropagation();
    const item = this.itemFotosActivo;
    if (!item?.fotos?.length) return;
    this.fotoActivaIdx = (this.fotoActivaIdx + 1) % item.fotos.length;
  }
}
