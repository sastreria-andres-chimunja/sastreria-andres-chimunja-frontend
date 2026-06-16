import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { PedidoService } from '../../../core/services/pedido.service';
import { ItemPedidoService } from '../../../core/services/item-pedido.service';
import { EstadoService } from '../../../core/services/estado.service';
import { ImagenService } from '../../../core/services/imagen.service';
import { MedidaService } from '../../../core/services/medida.service';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { MetodoPagoService } from '../../../core/services/metodos-pago.service';
import { AuthService } from '../../../core/services/auth.service';

import { Cliente } from '../../../shared/models/Cliente';
import { Empleado } from '../../../shared/models/Empleado';
import { Estado } from '../../../shared/models/Estado';
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
  ],
  templateUrl: './crear-pedido.component.html',
  styleUrl: './crear-pedido.component.css',
})
export class CrearPedidoComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  idPedido?: number;
  guardando = false;

  // Datos de apoyo
  estados: Estado[] = [];
  empleados: Empleado[] = [];
  clienteMedidas: Medida[] = [];
  metodosPago: any[] = [];

  // Cliente autocomplete
  clienteQuery = '';
  clientesSugeridos: Cliente[] = [];
  clienteSeleccionado: Cliente | null = null;
  mostrarSugerencias = false;
  private busquedaCliente$ = new Subject<string>();

  // Ítems del pedido
  items: any[] = [];
  totalCalculado = 0;
  totalAbonado = 0;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private pedidoService: PedidoService,
    private itemService: ItemPedidoService,
    private estadoService: EstadoService,
    private imagenService: ImagenService,
    private medidaService: MedidaService,
    private empleadoService: EmpleadoService,
    private clienteService: ClienteService,
    private metodoPagoService: MetodoPagoService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.cargarCatalogos();
    this.configurarBusquedaCliente();

    this.idPedido = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.isEdit = !!this.idPedido;

    if (this.isEdit) this.cargarPedido();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      idEstado: [null, Validators.required],
      fechaRecibido: [new Date(), Validators.required],
      fechaEntrega: [new Date(), Validators.required],
      valorTotal: [{ value: 0, disabled: true }],
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
    this.empleadoService.getAll().subscribe((r: any) => { this.empleados = r.empleados; });
    this.metodoPagoService.listarMetodosPago().subscribe((r: any) => {
      this.metodosPago = r.metodosPago ?? r ?? [];
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
    this.busquedaCliente$.next(this.clienteQuery);
  }

  seleccionarCliente(c: Cliente): void {
    this.clienteSeleccionado = c;
    this.clienteQuery = `${c.nombres} ${c.apellidos}`;
    this.mostrarSugerencias = false;
    this.clientesSugeridos = [];
    this.cargarMedidasCliente(c.idCliente!);
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
        idEstado: p.idEstado,
        fechaRecibido: stringToDate(p.fechaRecibido),
        fechaEntrega: stringToDate(p.fechaEntrega),
        valorTotal: p.valorTotal,
      });
      this.clienteQuery = p.nombreCliente ?? '';
      this.clienteSeleccionado = {
        idCliente: p.idCliente,
        nombres: (p.nombreCliente ?? '').split(' ')[0],
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

  get saldoPedido(): number {
    return this.totalCalculado - this.totalAbonado;
  }

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

    if (idEstadoActual === idTerminado || idEstadoActual === idEntregado) return;

    const tieneEmpleado = this.items.some(it => !!it.idEmpleado);
    const idAsignado  = this.estados.find(e => e.nombre === 'Asignado')?.idEstado;
    const idPendiente = this.estados.find(e => e.nombre === 'Pendiente')?.idEstado;

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

  // ── Solo visible para admin y asistente ─────────────────────
  get puedeEditarPedido(): boolean {
    return !this.authService.esOperario();
  }

  // ── Ítem dialog ───────────────────────────────────────────────
  abrirDialogoItem(item?: any): void {
    const dialogData: ItemDialogData = {
      item: item ?? null,
      idPedido: this.idPedido ?? 0,
      idCliente: this.clienteSeleccionado?.idCliente ?? 0,
      empleados: this.empleados,
      medidas: this.clienteMedidas,
      imagenes: item?._fotos ?? [],
    };

    const ref = this.dialog.open(ItemPedidoDialogComponent, {
      data: dialogData,
      maxWidth: '95vw',
      maxHeight: '92vh',
      panelClass: 'nomina-dialog-panel',
      autoFocus: false,
    });

    ref.afterClosed().subscribe((result: ItemDialogResult | null) => {
      if (!result) return;

      if (this.isEdit) {
        this.guardarItemDirecto(result, item);
      } else {
        const idx = this.items.indexOf(item);
        if (idx >= 0) {
          this.items[idx] = { ...result.item, _fotosNuevas: result.fotosNuevas };
        } else {
          this.items.push({ ...result.item, _fotosNuevas: result.fotosNuevas, _nuevaMedida: result.nuevaMedida, _fotosNuevaMedida: result.fotosNuevaMedida });
        }
        this.recalcularTotal();
        this.actualizarEstadoAutomatico();
      }
    });
  }

  // ── Abono del cliente al pedido ───────────────────────────────
  abrirDialogoPago(): void {
    if (!this.idPedido) return;

    const dialogData: PagarItemDialogData = {
      idPedido: this.idPedido,
      valorTotalPedido: this.totalCalculado,
      nombreCliente: this.clienteSeleccionado
        ? `${this.clienteSeleccionado.nombres} ${this.clienteSeleccionado.apellidos}`
        : this.clienteQuery,
      telefonoCliente: this.clienteSeleccionado?.telefono,
      metodosPago: this.metodosPago,
    };

    const ref = this.dialog.open(PagarItemDialogComponent, {
      data: dialogData,
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'nomina-dialog-panel',
      autoFocus: false,
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
    if (!this.clienteSeleccionado) { alert('Seleccione un cliente'); return; }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.guardando = true;
    const fv = this.form.getRawValue();
    const pedidoData = {
      idCliente: this.clienteSeleccionado.idCliente,
      idEstado: fv.idEstado,
      valorTotal: fv.valorTotal,
      fechaRecibido: dateToString(fv.fechaRecibido),
      fechaEntrega: dateToString(fv.fechaEntrega),
    };

    try {
      let idPed = this.idPedido;

      if (this.isEdit) {
        await this.pedidoService.actualizar(idPed!, pedidoData).toPromise();
      } else {
        const resp: any = await this.pedidoService.crear(pedidoData).toPromise();
        idPed = resp.pedido.idPedido;

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

          if (it._fotosNuevas?.length > 0) {
            const ir: any = await this.itemService.crear({ ...itemData, fechaEntrega: dateToString(itemData.fechaEntrega) }).toPromise();
            await this.imagenService.subir('itemPedido', ir.item.idItemPedido, it._fotosNuevas).toPromise();
          } else {
            await this.itemService.crear({ ...itemData, fechaEntrega: dateToString(itemData.fechaEntrega) }).toPromise();
          }
        }
      }

      this.router.navigate(['/app/pedidos']);
    } catch (e) {
      console.error(e);
      this.guardando = false;
    }
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
}
