import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NominaService } from '../../../core/services/nomina.service';
import { ItemPedidoService } from '../../../core/services/item-pedido.service';
import { GarantiaService } from '../../../core/services/garantia.service';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReciboService, ReciboNominaData } from '../../../core/services/recibo.service';
import { dateToString } from '../../../utils/date.utils';
import Swal from 'sweetalert2';

export interface NominaDetalleDialogData {
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  soloLectura?: boolean;
}

// Página (no modal, ver punto 8 del pedido del cliente) del detalle de
// nómina de UN empleado -- se llega acá desde "Empleados" (Admin/Asistente
// abren cualquier empleado) o, para el propio empleado, desde "Mis ítems".
@Component({
  selector: 'app-nomina-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
  cargandoEmpleado = true;
  resumen: any = null;
  data: NominaDetalleDialogData = { idEmpleado: 0, nombres: '', apellidos: '' };
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
    private route: ActivatedRoute,
    private location: Location,
    private nominaService: NominaService,
    private itemPedidoService: ItemPedidoService,
    private garantiaService: GarantiaService,
    private empleadoService: EmpleadoService,
    private authService: AuthService,
    private reciboService: ReciboService,
  ) {}

  ngOnInit(): void {
    const idEmpleado = Number(this.route.snapshot.paramMap.get('idEmpleado'));
    this.data.idEmpleado = idEmpleado;
    // Solo Admin puede pagar/liquidar -- el propio empleado (u otro rol)
    // ve su nómina en modo lectura, igual que antes en el modal.
    this.data.soloLectura = !this.authService.esAdmin();

    this.empleadoService.buscarPorId(idEmpleado).subscribe({
      next: (resp: any) => {
        const emp = resp.empleado;
        this.data.nombres = emp?.nombres ?? '';
        this.data.apellidos = emp?.apellidos ?? '';
        this.data.telefono = emp?.telefono;
        this.cargandoEmpleado = false;
      },
      error: () => { this.cargandoEmpleado = false; },
    });

    this.cargarResumen();
  }

  volver(): void {
    this.location.back();
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

  // % de comisión antes de que el usuario lo tocara -- se guarda al hacer
  // foco en el campo (ver onFocusComision()), para poder mostrarlo en la
  // confirmación y para revertir el valor mostrado si cancela o falla el
  // guardado. Clave unificada porque acá se mezclan ítems (idItemPedido) y
  // garantías (idGarantia) en la misma lista de "pendientes".
  private comisionOriginal = new Map<string, number>();

  private claveComision(item: any): string {
    return item._esGarantia ? `g${item.idGarantia}` : `i${item.idItemPedido}`;
  }

  onFocusComision(item: any): void {
    const clave = this.claveComision(item);
    if (!this.comisionOriginal.has(clave)) {
      this.comisionOriginal.set(clave, Number(item.comisionEmpleado ?? 0));
    }
  }

  /**
   * Cambiar la comisión afecta directamente cuánto se le paga al empleado
   * -- se confirma antes de guardar (con opción de cancelar), en vez de
   * guardar directo al cambiar el campo como antes. Sirve tanto para
   * ítems normales como para garantías (ver claveComision()) -- en una
   * garantía esto NO toca el gasto ya registrado (siempre el valor
   * completo), solo cuánto de eso se le reconoce al empleado.
   */
  actualizarComision(item: any, pct: number): void {
    const clave = this.claveComision(item);
    const nuevaComision = Math.max(0, Math.min(100, Number(pct) || 0));
    const anterior = this.comisionOriginal.get(clave) ?? nuevaComision;

    if (nuevaComision === anterior) return; // sin cambio real

    Swal.fire({
      title: '¿Cambiar la comisión?',
      html:
        `<b>${item.descripcion || 'Este ítem'}</b> pasará de <b>${anterior}%</b> a <b>${nuevaComision}%</b> de comisión.` +
        `<br>Esto cambia lo que se le paga al empleado por este${item._esGarantia ? ' concepto' : ' ítem'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#185FA5',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        item.comisionEmpleado = anterior;
        return;
      }
      const actualizar$ = item._esGarantia
        ? this.garantiaService.actualizarComision(item.idGarantia, nuevaComision)
        : this.itemPedidoService.actualizarComision(item.idItemPedido, nuevaComision);
      actualizar$.subscribe({
        next: () => {
          item.comisionEmpleado = nuevaComision;
          item.valorEmpleado = Number(item.valor ?? 0) * nuevaComision / 100;
          this.comisionOriginal.set(clave, nuevaComision);
          if (this.resumen?.pendientes) {
            this.resumen.totalPendiente = this.resumen.pendientes.reduce(
              (s: number, i: any) => s + Number(i.valorEmpleado ?? 0), 0
            );
            this.resumen.facturado = this.resumen.totalPendiente + Number(this.resumen.totalPagadoItems ?? 0);
            this.resumen.saldo = this.resumen.totalPendiente - Number(this.resumen.totalAbonos ?? 0);
          }
        },
        error: () => {
          item.comisionEmpleado = anterior;
        },
      });
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

}
