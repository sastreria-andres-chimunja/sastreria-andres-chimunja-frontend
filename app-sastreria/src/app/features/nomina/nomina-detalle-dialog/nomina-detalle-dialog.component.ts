import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NominaService } from '../../../core/services/nomina.service';
import { ItemPedidoService } from '../../../core/services/item-pedido.service';
import { ReciboService, ReciboNominaData } from '../../../core/services/recibo.service';
import { dateToString } from '../../../utils/date.utils';

export interface NominaDetalleDialogData {
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  soloLectura?: boolean;
}

@Component({
  selector: 'app-nomina-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  templateUrl: './nomina-detalle-dialog.component.html',
  styleUrl: './nomina-detalle-dialog.component.css',
})
export class NominaDetalleDialogComponent implements OnInit {
  cargando = true;
  resumen: any = null;
  pagandoId: number | null = null;
  pagandoTodo = false;
  ultimoItemPagado: any = null;
  generandoPDFNomina = false;
  enviandoWhatsAppNomina = false;
  avisoPegarImagenNomina = false;
  avisoAdjuntarImagenNomina = false;

  // ── Filtro de fecha del modal (único, no hay otro) -- agrupa TODO
  // (Facturado, Pendiente de pago, Abonos, Saldo, las pestañas de abajo)
  // por la fecha en que cada ítem pasó a Terminado, no por fecha de
  // entrega ni de pago. Sin filtro: se ve todo el histórico.
  filtroFechaAbierto = false;
  filtroFechaActivo = false;
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);

  // Se genera apenas se marca el pago (no al hacer clic en "Enviar a
  // WhatsApp") — compartir/copiar al portapapeles solo funciona si el
  // navegador todavía considera "reciente" el clic del usuario, y generar
  // la imagen puede tardar lo suficiente como para perder esa ventana.
  // Precalculándola apenas se conoce el item pagado, para cuando el usuario
  // haga clic la imagen casi siempre ya está lista.
  private imagenPromise?: Promise<File>;

  constructor(
    public dialogRef: MatDialogRef<NominaDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NominaDetalleDialogData,
    private nominaService: NominaService,
    private itemPedidoService: ItemPedidoService,
    private reciboService: ReciboService,
  ) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  toggleFiltroFecha(): void {
    this.filtroFechaAbierto = !this.filtroFechaAbierto;
  }

  aplicarFiltroFecha(): void {
    this.filtroFechaActivo = !!(this.fechaInicioCtrl.value || this.fechaFinCtrl.value);
    this.filtroFechaAbierto = false;
    this.cargarResumen();
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
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.cargando = true;
    const inicio = this.fechaInicioCtrl.value ? dateToString(this.fechaInicioCtrl.value) : undefined;
    const fin = this.fechaFinCtrl.value ? dateToString(this.fechaFinCtrl.value) : undefined;
    this.nominaService.resumenPeriodo(this.data.idEmpleado, inicio, fin).subscribe({
      next: (resp: any) => {
        this.resumen = resp.resumen;
        this.cargando = false;
      },
      error: () => { this.cargando = false; },
    });
  }

  private get nominaReciboData(): ReciboNominaData {
    const item = this.ultimoItemPagado!;
    const valorEmpleado = Number(item.valorEmpleado ?? 0)
      || (Number(item.valor ?? 0) * Number(item.comisionEmpleado ?? 0) / 100);
    return {
      idItemPedido:    item.idItemPedido,
      idPedido:        item.idPedido,
      nombreEmpleado:  `${this.data.nombres} ${this.data.apellidos}`,
      telefonoEmpleado: this.data.telefono,
      descripcion:     item.descripcion ?? '',
      valor:           valorEmpleado,
      fechaPago:       new Date().toLocaleDateString('es-CO'),
      esLiquidacionTotal: !!item._esLiquidacionTotal,
      cantidadItems:      item._cantidadItems,
    };
  }

  imprimirTicketNomina(): void {
    if (!this.ultimoItemPagado) return;
    this.reciboService.imprimirNomina(this.nominaReciboData);
  }

  /** Genera el PDF y lo descarga directo, para quien quiera guardarlo/imprimirlo aparte. */
  async generarPDFNomina(): Promise<void> {
    this.generandoPDFNomina = true;
    try {
      const archivo = await this.reciboService.generarPDFBlobNomina(this.nominaReciboData);
      this.reciboService.descargarBlob(archivo, archivo.name);
    } finally {
      this.generandoPDFNomina = false;
    }
  }

  /**
   * Genera una imagen del comprobante y la deja lista para enviar por
   * WhatsApp (se ve grande de inmediato en el chat, como un comprobante
   * bancario). Siempre usa el método manual (copiar al portapapeles + abrir
   * el chat del empleado, o compartir nativo en celular si el portapapeles
   * no está disponible) — el envío automático vía backend (Meta Cloud API)
   * se desactivó a propósito: ese envío sale desde el número nuevo
   * registrado en la API, no desde el número que ya conocen los empleados.
   */
  async enviarWhatsAppNomina(): Promise<void> {
    if (!this.data.telefono) return;
    const texto = this.reciboService.generarTextoWhatsAppNomina(this.nominaReciboData);

    this.enviandoWhatsAppNomina = true;
    this.avisoPegarImagenNomina = false;
    this.avisoAdjuntarImagenNomina = false;
    try {
      // Si por algo no se alcanzó a precalcular al marcar el pago (o falló),
      // se genera aquí como respaldo — más lento, pero mejor que fallar.
      const imagen = await (this.imagenPromise ?? this.reciboService.generarImagenBlobNomina(this.nominaReciboData));
      const resultado = await this.reciboService.compartirConWhatsApp(imagen, this.data.telefono, texto);
      if (resultado === '_clipboard_') this.avisoPegarImagenNomina = true;
      else this.avisoAdjuntarImagenNomina = true;
    } finally {
      this.enviandoWhatsAppNomina = false;
    }
  }

  pagar(item: any): void {
    this.pagandoId = item.idItemPedido;
    this.ultimoItemPagado   = null;
    this.avisoPegarImagenNomina = false;
    this.avisoAdjuntarImagenNomina = false;
    this.imagenPromise = undefined;
    this.itemPedidoService.pagar(item.idItemPedido).subscribe({
      next: (resp: any) => {
        this.pagandoId = null;
        this.ultimoItemPagado = resp.item ?? item;
        this.imagenPromise = this.reciboService.generarImagenBlobNomina(this.nominaReciboData);
        this.cargarResumen();
      },
      error: () => { this.pagandoId = null; },
    });
  }

  /**
   * Liquida TODOS los ítems pendientes del empleado (sin importar el
   * período elegido acá — es la misma acción masiva de siempre). Por eso
   * solo se muestra cuando no hay un filtro de fecha activo: con un
   * filtro puesto, "Pendiente de pago" ya no representa el total real, y
   * el botón terminaría pagando de más de lo que el número visible sugiere.
   */
  pagarTodo(): void {
    const pendientes = this.resumen?.pendientes ?? [];
    if (pendientes.length === 0) return;
    this.pagandoTodo       = true;
    this.ultimoItemPagado  = null;
    this.avisoPegarImagenNomina = false;
    this.avisoAdjuntarImagenNomina = false;
    this.imagenPromise = undefined;

    this.nominaService.liquidar(this.data.idEmpleado).subscribe({
      next: (resp: any) => {
        this.pagandoTodo = false;
        const items: any[] = resp?.items ?? [];
        // Comprobante consolidado: reutiliza toda la infraestructura de
        // recibo (ticket/PDF/WhatsApp) ya construida para el pago de un
        // ítem individual, armando un "ítem" sintético que resume la
        // liquidación completa en vez de un ítem/pedido puntual.
        if (items.length > 0) {
          const descripcion = items.length === 1
            ? items[0].descripcion
            : `Liquidación de nómina — ${items.length} ítems terminados`;
          this.ultimoItemPagado = {
            idItemPedido: items[0].idItemPedido,
            idPedido: items[0].idPedido,
            descripcion,
            valorEmpleado: Number(resp?.totalPagado ?? 0),
            _esLiquidacionTotal: true,
            _cantidadItems: items.length,
          };
          this.imagenPromise = this.reciboService.generarImagenBlobNomina(this.nominaReciboData);
        }
        this.cargarResumen();
      },
      error: () => { this.pagandoTodo = false; },
    });
  }

  actualizarComision(item: any, pct: number): void {
    const comision = Math.max(0, Math.min(100, Number(pct) || 0));
    this.itemPedidoService.actualizarComision(item.idItemPedido, comision).subscribe({
      next: () => {
        item.comisionEmpleado = comision;
        item.valorEmpleado = Number(item.valor ?? 0) * comision / 100;
        if (this.resumen?.pendientes) {
          this.resumen.totalPendiente = this.resumen.pendientes.reduce(
            (s: number, i: any) => s + Number(i.valorEmpleado ?? 0), 0
          );
          this.resumen.facturado = this.resumen.totalPendiente + Number(this.resumen.totalPagadoItems ?? 0);
          this.resumen.saldo = this.resumen.totalPendiente - Number(this.resumen.totalAbonos ?? 0);
        }
      },
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
