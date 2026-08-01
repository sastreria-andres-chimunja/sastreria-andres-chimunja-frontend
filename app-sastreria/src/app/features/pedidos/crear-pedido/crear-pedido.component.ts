import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import Swal from 'sweetalert2';

import { PedidoService } from '../../../core/services/pedido.service';
import { ItemPedidoService } from '../../../core/services/item-pedido.service';
import { EstadoService } from '../../../core/services/estado.service';
import { TipoPedidoService } from '../../../core/services/tipo-pedido.service';
import { LimiteDiarioService } from '../../../core/services/limite-diario.service';
import { ImagenService } from '../../../core/services/imagen.service';
import { MedidaService } from '../../../core/services/medida.service';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { MetodoPagoService } from '../../../core/services/metodos-pago.service';
import { AuthService } from '../../../core/services/auth.service';

import { Cliente } from '../../../shared/models/Cliente';
import { Empleado } from '../../../shared/models/Empleado';
import { Estado } from '../../../shared/models/Estado';
import { TipoPedido } from '../../../shared/models/TipoPedido';
import { Medida } from '../../../shared/models/Medida';
import { Pedido } from '../../../shared/models/Pedido';

import { dateToString, stringToDate } from '../../../utils/date.utils';
import {
  ItemPedidoDialogComponent,
  ItemDialogData,
  ItemDialogResult,
} from '../item-pedido-dialog/item-pedido-dialog.component';
import {
  PagarItemDialogComponent,
  PagarItemDialogData,
} from '../pagar-item-dialog/pagar-item-dialog.component';
import {
  PedidoGuardadoDialogComponent,
  PedidoGuardadoDialogData,
} from '../pedido-guardado-dialog/pedido-guardado-dialog.component';
import { ItemInlineFormComponent } from '../item-inline-form/item-inline-form.component';

@Component({
  selector: 'app-crear-pedido',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatSnackBarModule,
    ItemInlineFormComponent,
  ],
  templateUrl: './crear-pedido.component.html',
  styleUrl: './crear-pedido.component.css',
})
export class CrearPedidoComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  idPedido?: number;
  private tokenPublicoActual?: string;
  guardando = false;

  // Snapshot al cargar en modo edición: el límite diario solo se evalúa si
  // cambia la fecha de entrega o el valor total (ítems), no en cambios de
  // estado ni pagos.
  private fechaEntregaOriginal: string | null = null;
  private valorTotalOriginal = 0;

  // Datos de apoyo
  estados: Estado[] = [];
  tiposPedido: TipoPedido[] = [];
  empleados: Empleado[] = [];
  clienteMedidas: Medida[] = [];
  metodosPago: any[] = [];

  // Cliente autocomplete
  clienteQuery = '';
  clientesSugeridos: Cliente[] = [];
  clienteSeleccionado: Cliente | null = null;
  mostrarSugerencias = false;
  private busquedaCliente$ = new Subject<string>();

  // Crear cliente inline
  mostrarFormCrearCliente = false;
  clienteForm!: FormGroup;
  creandoCliente = false;

  // Ítems del pedido
  items: any[] = [];
  totalCalculado = 0;
  totalAbonado = 0;

  // Acordeón de ítems (modo crear)
  panelExpandidoIdx: number | null = null;
  mostrarFormNuevoItem = true;
  valorFormActual = 0;

  // Abono inicial (solo en creación)
  abonoForm!: FormGroup;

  @ViewChild('formNuevoItem') formNuevoItemRef?: ItemInlineFormComponent;
  @ViewChild('itemFormSection') itemFormSectionRef?: ElementRef<HTMLElement>;

  get totalConFormActual(): number {
    return this.totalCalculado + this.valorFormActual;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private pedidoService: PedidoService,
    private itemService: ItemPedidoService,
    private estadoService: EstadoService,
    private tipoPedidoService: TipoPedidoService,
    private limiteDiarioService: LimiteDiarioService,
    private imagenService: ImagenService,
    private medidaService: MedidaService,
    private empleadoService: EmpleadoService,
    private clienteService: ClienteService,
    private metodoPagoService: MetodoPagoService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.buildClienteForm();
    this.abonoForm = this.fb.group({
      valor:        [null],
      idMetodoPago: [null],
    });
    this.cargarCatalogos();
    this.configurarBusquedaCliente();

    this.idPedido = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.isEdit = !!this.idPedido;

    if (this.isEdit) this.cargarPedido();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      idEstado:      [null, Validators.required],
      idTipoPedido:  [null, Validators.required],
      fechaRecibido: [new Date(), Validators.required],
      fechaEntrega:  [new Date(), Validators.required],
      valorTotal:    [{ value: 0, disabled: true }],
    });
  }

  private buildClienteForm(): void {
    this.clienteForm = this.fb.group({
      nombres:   ['', Validators.required],
      apellidos: ['', Validators.required],
      cedula:    [''],
      telefono:  [''],
    });
  }

  private cargarCatalogos(): void {
    this.estadoService.listar().subscribe((r: any) => {
      this.estados = r.estados;
      if (!this.isEdit) {
        const pendiente = this.estados.find((e) => e.nombre === 'Pendiente');
        if (pendiente) this.form.patchValue({ idEstado: pendiente.idEstado });
      }
    });
    this.tipoPedidoService.listar().subscribe((r: any) => {
      this.tiposPedido = r.tiposPedido ?? [];
      if (!this.isEdit) {
        const tipoTab = this.route.snapshot.queryParamMap.get('tipo');
        const match = this.tiposPedido.find((t) =>
          tipoTab === 'confeccion'
            ? t.nombre.toLowerCase().includes('confecci')
            : t.nombre.toLowerCase().includes('arreglo'),
        );
        if (tipoTab && match) this.form.patchValue({ idTipoPedido: match.idTipoPedido });
      }
    });
    this.empleadoService.getAll().subscribe((r: any) => { this.empleados = r.empleados; });
    this.metodoPagoService.listarMetodosPago().subscribe((r: any) => {
      this.metodosPago = r.metodosPago ?? [];
    });
  }

  private configurarBusquedaCliente(): void {
    this.busquedaCliente$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q) => {
        if (q.trim().length < 2) { this.clientesSugeridos = []; return; }
        this.clienteService.buscar(q).subscribe((r: any) => {
          this.clientesSugeridos = r.clientes ?? [];
          this.mostrarSugerencias = true;
        });
      });
  }

  onClienteInput(event: Event): void {
    this.clienteQuery = (event.target as HTMLInputElement).value;
    this.clienteSeleccionado = null;
    this.mostrarFormCrearCliente = false;
    this.busquedaCliente$.next(this.clienteQuery);
  }

  seleccionarCliente(c: Cliente): void {
    this.clienteSeleccionado = c;
    this.clienteQuery = `${c.nombres} ${c.apellidos}`;
    this.mostrarSugerencias = false;
    this.clientesSugeridos = [];
    this.mostrarFormCrearCliente = false;
    this.cargarMedidasCliente(c.idCliente!);
  }

  abrirFormCrearCliente(): void {
    this.mostrarSugerencias = false;
    this.mostrarFormCrearCliente = true;
    this.clienteForm.reset();
    if (this.clienteQuery.trim()) {
      const partes = this.clienteQuery.trim().split(' ');
      this.clienteForm.patchValue({
        nombres: partes[0] ?? '',
        apellidos: partes.slice(1).join(' ') ?? '',
      });
    }
  }

  cancelarCrearCliente(): void {
    this.mostrarFormCrearCliente = false;
  }

  guardarNuevoCliente(): void {
    if (this.clienteForm.invalid) { this.clienteForm.markAllAsTouched(); return; }
    this.creandoCliente = true;
    this.clienteService.crear(this.clienteForm.value).subscribe({
      next: (r: any) => {
        const c: Cliente = r.cliente;
        this.seleccionarCliente(c);
        this.mostrarFormCrearCliente = false;
        this.creandoCliente = false;
      },
      error: () => { this.creandoCliente = false; },
    });
  }

  private cargarMedidasCliente(idCliente: number): void {
    this.medidaService.listarMedidasPorCliente(idCliente).subscribe((r: any) => {
      this.clienteMedidas = r.medidas ?? [];
    });
  }

  private cargarPedido(): void {
    this.pedidoService.buscarPorId(this.idPedido!).subscribe((r: any) => {
      const p: Pedido = r.pedido;
      this.form.patchValue({
        idEstado:      p.idEstado,
        idTipoPedido:  p.idTipoPedido,
        fechaRecibido: stringToDate(p.fechaRecibido),
        fechaEntrega:  stringToDate(p.fechaEntrega),
        valorTotal:    p.valorTotal,
      });
      this.fechaEntregaOriginal = p.fechaEntrega;
      this.valorTotalOriginal   = Number(p.valorTotal ?? 0);
      this.tokenPublicoActual   = p.tokenPublico;
      this.clienteQuery = p.nombreCliente ?? '';
      this.clienteSeleccionado = {
        idCliente: p.idCliente,
        nombres:   (p.nombreCliente ?? '').split(' ')[0],
        apellidos: (p.nombreCliente ?? '').split(' ').slice(1).join(' '),
        cedula: '', telefono: p.telefonoCliente ?? '',
      };
      this.cargarMedidasCliente(p.idCliente);
      this.cargarItems();
      this.cargarAbonos();
    });
  }

  cargarAbonos(): void {
    if (!this.idPedido) return;
    this.pedidoService.getAbonosPedido(this.idPedido).subscribe({
      next: (resp: any) => {
        const abonos: any[] = resp.abonos ?? [];
        this.totalAbonado = abonos.reduce((s, a) => s + Number(a.valor), 0);
      },
    });
  }

  get saldoPedido(): number { return this.totalCalculado - this.totalAbonado; }

  private cargarItems(): void {
    this.itemService.listarPorPedido(this.idPedido!).subscribe((r: any) => {
      this.items = r.items ?? [];
      this.items.forEach((item: any) => {
        this.imagenService.listarPorReferencia('itemPedido', item.idItemPedido)
          .subscribe((imgs) => { item._fotos = imgs; });
      });
      this.recalcularTotal();
      this.actualizarEstadoAutomatico();
    });
  }

  private actualizarEstadoAutomatico(): void {
    const idEstadoActual = this.form.get('idEstado')?.value;
    const idTerminado = this.estados.find(e => e.nombre === 'Terminado')?.idEstado;
    const idEntregado = this.estados.find(e => e.nombre === 'Entregado')?.idEstado;
    const idNoRealizado = this.estados.find(e => e.nombre === 'No realizado')?.idEstado;

    if (idEstadoActual === idTerminado || idEstadoActual === idEntregado || idEstadoActual === idNoRealizado) return;

    const tieneEmpleado = this.items.some(it => !!it.idEmpleado);
    const idAsignado    = this.estados.find(e => e.nombre === 'Asignado')?.idEstado;
    const idPendiente   = this.estados.find(e => e.nombre === 'Pendiente')?.idEstado;

    if (tieneEmpleado && idAsignado) {
      this.form.patchValue({ idEstado: idAsignado });
    } else if (!tieneEmpleado && idPendiente) {
      this.form.patchValue({ idEstado: idPendiente });
    }
  }

  get estadosManualmenteSeleccionables(): Estado[] {
    return this.estados.filter(e => e.nombre === 'Terminado' || e.nombre === 'Entregado');
  }

  get estadoActualEsManual(): boolean {
    const idTerminado = this.estados.find(e => e.nombre === 'Terminado')?.idEstado;
    const idEntregado = this.estados.find(e => e.nombre === 'Entregado')?.idEstado;
    const val = this.form.get('idEstado')?.value;
    return val === idTerminado || val === idEntregado;
  }

  get nombreEstadoAuto(): string {
    const id = this.form.get('idEstado')?.value;
    return this.estados.find(e => e.idEstado === id)?.nombre ?? '';
  }

  get puedeEditarPedido(): boolean { return !this.authService.esOperario(); }
  get esAdmin(): boolean { return this.authService.esAdmin(); }

  // ── Modo CREAR: inline form ───────────────────────────────────
  /** Botón "Agregar ítem" de arriba: el formulario suele quedar siempre abierto
   *  (ver onItemAgregado), así que en vez de solo abrirlo, lo trae a la vista. */
  irAFormularioItem(): void {
    this.mostrarFormNuevoItem = true;
    setTimeout(() => {
      this.itemFormSectionRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  onItemAgregado(result: ItemDialogResult): void {
    this.items.push({
      ...result.item,
      _fotosNuevas:      result.fotosNuevas,
      _nuevaMedida:      result.nuevaMedida,
      _fotosNuevaMedida: result.fotosNuevaMedida,
    });
    this.mostrarFormNuevoItem = true;
    this.recalcularTotal();
    this.actualizarEstadoAutomatico();
  }

  onItemActualizado(result: ItemDialogResult, idx: number): void {
    this.items[idx] = {
      ...result.item,
      _fotosNuevas:      result.fotosNuevas,
      _nuevaMedida:      result.nuevaMedida,
      _fotosNuevaMedida: result.fotosNuevaMedida,
    };
    this.panelExpandidoIdx = null;
    this.recalcularTotal();
    this.actualizarEstadoAutomatico();
  }

  togglePanel(idx: number): void {
    this.panelExpandidoIdx = this.panelExpandidoIdx === idx ? null : idx;
  }

  // ── Modo EDITAR: dialog (comportamiento actual) ───────────────
  abrirDialogoItem(item?: any): void {
    const dialogData: ItemDialogData = {
      item:      item ?? null,
      idPedido:  this.idPedido ?? 0,
      idCliente: this.clienteSeleccionado?.idCliente ?? 0,
      empleados: this.empleados,
      medidas:   this.clienteMedidas,
      imagenes:  item?._fotos ?? [],
    };

    const ref = this.dialog.open(ItemPedidoDialogComponent, {
      data:        dialogData,
      maxWidth:    '95vw',
      maxHeight:   '92vh',
      panelClass:  'nomina-dialog-panel',
      autoFocus:   false,
    });

    ref.afterClosed().subscribe((result: ItemDialogResult | null) => {
      if (!result) return;
      this.guardarItemDirecto(result, item);
    });
  }

  abrirDialogoPago(): void {
    if (!this.idPedido) return;

    const fechaEntregaPedido = this.form.get('fechaEntrega')?.value;
    const dialogData: PagarItemDialogData = {
      idPedido:         this.idPedido,
      valorTotalPedido: this.totalCalculado,
      nombreCliente:    this.clienteSeleccionado
        ? `${this.clienteSeleccionado.nombres} ${this.clienteSeleccionado.apellidos}`
        : this.clienteQuery,
      telefonoCliente: this.clienteSeleccionado?.telefono,
      metodosPago:     this.metodosPago,
      items:           this.items.map((it: any) => ({ descripcion: it.descripcion, valor: Number(it.valor) })),
      fechaEntrega:    dateToString(fechaEntregaPedido) || undefined,
      tokenPublico:    this.tokenPublicoActual,
    };

    const ref = this.dialog.open(PagarItemDialogComponent, {
      data:       dialogData,
      maxWidth:   '95vw',
      maxHeight:  '90vh',
      panelClass: 'nomina-dialog-panel',
      autoFocus:  false,
    });

    ref.afterClosed().subscribe((result: any) => {
      if (result?.totalAbonado !== undefined) {
        this.totalAbonado = result.totalAbonado;
      }
    });
  }

  private guardarItemDirecto(result: ItemDialogResult, itemOriginal?: any): void {
    const guardarFn = (idMedida: number | null) => {
      const itemData = {
        ...result.item,
        idMedida,
        fechaEntrega: dateToString(result.item.fechaEntrega),
      };
      const obs = itemOriginal?.idItemPedido
        ? this.itemService.actualizar(itemOriginal.idItemPedido, itemData)
        : this.itemService.crear(itemData);

      obs.subscribe((r: any) => {
        const savedItem = r.item;
        if (result.fotosNuevas.length > 0) {
          this.imagenService.subir('itemPedido', savedItem.idItemPedido, result.fotosNuevas).subscribe();
        }
        result.fotosEliminar.forEach((id) => this.imagenService.eliminar(id).subscribe());
        this.cargarItems();
      });
    };

    if (result.nuevaMedida) {
      this.medidaService.crear(result.nuevaMedida).subscribe((r: any) => {
        const idMedida = r.medida?.idMedida ?? null;
        if (idMedida && result.fotosNuevaMedida?.length > 0) {
          this.imagenService.subir('Medida', idMedida, result.fotosNuevaMedida).subscribe();
        }
        guardarFn(idMedida);
      });
    } else {
      guardarFn(result.item.idMedida ?? null);
    }
  }

  eliminarItem(item: any, i: number): void {
    if (item.idItemPedido) {
      this.itemService.eliminar(item.idItemPedido).subscribe(() => this.cargarItems());
    } else {
      this.items.splice(i, 1);
      if (this.panelExpandidoIdx === i) this.panelExpandidoIdx = null;
      this.recalcularTotal();
      this.actualizarEstadoAutomatico();
    }
  }

  recalcularTotal(): void {
    this.totalCalculado = this.items.reduce((s, it) => s + Number(it.valor ?? 0), 0);
    this.form.patchValue({ valorTotal: this.totalCalculado });
  }

  // ── Guardar pedido completo ───────────────────────────────────
  async guardar(): Promise<void> {
    if (!this.clienteSeleccionado) {
      this.snackBar.open('Selecciona o crea un cliente para guardar el pedido.', 'Cerrar', {
        duration: 5000, panelClass: ['snack-error'],
      });
      return;
    }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    // Capturar ítem del formulario inline si tiene datos sin agregar
    if (!this.isEdit && this.formNuevoItemRef && this.mostrarFormNuevoItem) {
      const pendiente = this.formNuevoItemRef.obtenerResultadoSiValido();
      if (pendiente) {
        this.items.push({
          ...pendiente.item,
          _fotosNuevas:      pendiente.fotosNuevas,
          _nuevaMedida:      pendiente.nuevaMedida,
          _fotosNuevaMedida: pendiente.fotosNuevaMedida,
        });
        this.recalcularTotal();
      } else if (this.formNuevoItemRef.form.get('descripcion')?.value?.trim()) {
        return; // form con datos inválidos — dejar que muestre los errores
      }
    }

    const fv = this.form.getRawValue();

    // Límite diario de entregas: solo se evalúa al crear un pedido nuevo, o al
    // editar si cambia la fecha de entrega o el valor total (ítems agregados/
    // quitados). Cambios de estado o pagos no deben verse afectados por esto.
    const fechaEntregaStr = dateToString(fv.fechaEntrega);
    const fechaCambio = this.isEdit && fechaEntregaStr !== this.fechaEntregaOriginal;
    const totalCambio = this.isEdit && Number(fv.valorTotal ?? 0) !== this.valorTotalOriginal;
    if (!this.isEdit || fechaCambio || totalCambio) {
      const [limiteResp, programadoResp]: [any, any] = await Promise.all([
        this.limiteDiarioService.obtener().toPromise(),
        this.pedidoService.getValorProgramado(fechaEntregaStr, this.idPedido).toPromise(),
      ]);
      const limite = Number(limiteResp?.limiteDiario?.monto ?? Infinity);
      const yaProgramado = Number(programadoResp?.valorProgramado ?? 0);
      const totalDia = yaProgramado + Number(fv.valorTotal ?? 0);
      if (totalDia > limite) {
        const confirmacion = await Swal.fire({
          icon: 'warning',
          title: 'Límite diario superado',
          html:
            `Se supera el límite diario de entregas para el <b>${fechaEntregaStr}</b> ` +
            `(máximo ${this.formatCOP(limite)}, ya hay ${this.formatCOP(yaProgramado)} programados).<br><br>` +
            `¿Deseas crear el pedido de todas formas?`,
          showCancelButton: true,
          confirmButtonText: 'Sí, crear de todas formas',
          cancelButtonText: 'Cambiar fecha',
          confirmButtonColor: '#d32f2f',
        });
        if (!confirmacion.isConfirmed) return;
      }
    }

    this.guardando = true;
    const pedidoData = {
      idCliente:     this.clienteSeleccionado.idCliente,
      idEstado:      fv.idEstado,
      idTipoPedido:  fv.idTipoPedido,
      valorTotal:    fv.valorTotal,
      fechaRecibido: dateToString(fv.fechaRecibido),
      fechaEntrega:  dateToString(fv.fechaEntrega),
    };

    try {
      let idPed = this.idPedido;

      if (this.isEdit) {
        await this.pedidoService.actualizar(idPed!, pedidoData).toPromise();
        const itemsResumenEdit = this.items.map((it: any) => ({
          descripcion: String(it.descripcion ?? ''),
          valor: Number(it.valor ?? 0),
        }));
        // totalAbonado ya está cargado (cargarAbonos() en cargarPedido()) con
        // el total real de abonos previos del pedido — antes se mandaba 0 fijo
        // aquí, así que los documentos impresos/enviados desde "Editar pedido"
        // mostraban saldo completo aunque ya hubiera abonos registrados.
        this.abrirDialogoGuardado(
          idPed!, 0, this.totalAbonado, '',
          dateToString(fv.fechaEntrega),
          itemsResumenEdit,
        );
      } else {
        const resp: any = await this.pedidoService.crear(pedidoData).toPromise();
        idPed = resp.pedido.idPedido;
        this.tokenPublicoActual = resp.pedido.tokenPublico;

        for (const it of this.items) {
          let idMedida: number | null = null;

          if (it._nuevaMedida) {
            const mr: any = await this.medidaService.crear({ ...it._nuevaMedida, idCliente: this.clienteSeleccionado!.idCliente }).toPromise();
            idMedida = mr.medida?.idMedida ?? null;
            if (idMedida && it._fotosNuevaMedida?.length > 0) {
              await this.imagenService.subir('Medida', idMedida, it._fotosNuevaMedida).toPromise();
            }
          } else if (it.idMedida) {
            idMedida = it.idMedida;
          }

          const itemData = { ...it, idPedido: idPed, idMedida };
          delete itemData._fotosNuevas;
          delete itemData._nuevaMedida;
          delete itemData._fotos;
          delete itemData._fotosNuevaMedida;

          const fechaItem = itemData.fechaEntrega ?? fv.fechaEntrega;
          if (it._fotosNuevas?.length > 0) {
            const ir: any = await this.itemService.crear({ ...itemData, fechaEntrega: dateToString(fechaItem) }).toPromise();
            await this.imagenService.subir('itemPedido', ir.item.idItemPedido, it._fotosNuevas).toPromise();
          } else {
            await this.itemService.crear({ ...itemData, fechaEntrega: dateToString(fechaItem) }).toPromise();
          }
        }

        // Registrar abono inicial si el usuario ingresó un valor
        const av = this.abonoForm.value;
        const valorAbono = av.valor && Number(av.valor) > 0 ? Number(av.valor) : 0;
        if (valorAbono > 0) {
          await this.pedidoService.registrarAbono(idPed!, {
            idMetodoPago: av.idMetodoPago ?? null,
            valor:        valorAbono,
          }).toPromise();
        }

        const metodo = this.metodosPago.find(m => m.idMetodoPago === av.idMetodoPago);
        const itemsResumen = this.items.map(it => ({
          descripcion: String(it.descripcion ?? ''),
          valor: Number(it.valor ?? 0),
        }));
        this.abrirDialogoGuardado(
          idPed!, valorAbono, valorAbono, metodo?.nombreMetodoPago ?? '',
          dateToString(fv.fechaEntrega),
          itemsResumen,
        );
      }
    } catch (e) {
      console.error(e);
      this.snackBar.open('Error al guardar. Intenta de nuevo.', 'Cerrar', {
        duration: 5000, panelClass: ['snack-error'],
      });
      this.guardando = false;
    }
  }

  private abrirDialogoGuardado(
    idPedido: number,
    valorAbono: number,
    totalPagado: number,
    nombreMetodoPago: string,
    fechaEntrega?: string,
    items?: { descripcion: string; valor: number }[],
  ): void {
    this.guardando = false;
    const data: PedidoGuardadoDialogData = {
      idPedido,
      nombreCliente:    this.clienteSeleccionado
        ? `${this.clienteSeleccionado.nombres} ${this.clienteSeleccionado.apellidos}`
        : this.clienteQuery,
      telefonoCliente:  this.clienteSeleccionado?.telefono,
      valorTotal:       this.totalCalculado,
      valorAbono,
      totalPagado,
      nombreMetodoPago: nombreMetodoPago || undefined,
      fechaEntrega,
      items,
      tokenPublico: this.tokenPublicoActual,
    };
    const ref = this.dialog.open(PedidoGuardadoDialogComponent, {
      data,
      width: '400px',
      disableClose: true,
      panelClass: 'nomina-dialog-panel',
    });
    ref.afterClosed().subscribe(() => this.router.navigate(['/app/pedidos']));
  }

  volver(): void { this.router.navigate(['/app/pedidos']); }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  getInitials(nombre: string): string {
    return (nombre ?? '?').split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  getImageUrl(ruta: string): string { return `http://localhost:3000/${ruta}`; }

  getEstadoChipStyle(nombreEstado: string | undefined): Record<string, string> {
    const estado = (nombreEstado || '').toLowerCase();
    const map: Record<string, { bg: string; color: string }> = {
      'pendiente':  { bg: '#f0f0f0', color: '#666' },
      'asignado':   { bg: '#e3f2fd', color: '#1565c0' },
      'en proceso': { bg: '#fff8e1', color: '#f57f17' },
      'listo':      { bg: '#e8f5e9', color: '#2e7d32' },
      'entregado':  { bg: '#1b5e20', color: '#fff' },
    };
    const style = map[estado] ?? { bg: '#f0f0f0', color: '#444' };
    return { 'background-color': style.bg, color: style.color };
  }

  getNombreEmpleado(item: any): string {
    if (item.nombreEmpleado) return item.nombreEmpleado;
    if (item.idEmpleado) {
      const emp = this.empleados.find(e => e.idEmpleado === item.idEmpleado);
      return emp ? `${emp.nombres} ${emp.apellidos}` : `Empleado #${item.idEmpleado}`;
    }
    return '';
  }
}
