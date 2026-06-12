import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Movimiento } from '../../../shared/models/Movimiento';
import { CategoriaMovimiento } from '../../../shared/models/CategoriaMovimiento';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { CategoriaMovimientoService } from '../../../core/services/categoria-movimiento.service';
import { TipoMovimientoService } from '../../../core/services/tipo-movimiento.service';
import { TipoMovimiento } from '../../../shared/models/TipoMovimiento';
import { MetodoPagoService } from '../../../core/services/metodos-pago.service';
import { MetodoPago } from '../../../shared/models/MetodoPago';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { Empleado } from '../../../shared/models/Empleado';
import { dateToString, stringToDate } from '../../../utils/date.utils';

@Component({
  selector: 'app-crear-movimiento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  templateUrl: './crear-movimiento.component.html',
  styleUrl: './crear-movimiento.component.css',
})
export class CrearMovimientoComponent implements OnInit {
  form!: FormGroup;
  movimiento = new Movimiento();
  isLoading = false;
  titulo = '';
  categorias: CategoriaMovimiento[] = [];
  metodosPago: MetodoPago[] = [];
  tiposMovimiento: TipoMovimiento[] = [];
  empleados: Empleado[] = [];

  readonly tiposReferencia = [
    { label: 'Empleado',  value: 'Nómina' },
    { label: 'Ventas',    value: 'Ventas' },
  ];

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoService,
    private categoriaService: CategoriaMovimientoService,
    private tipoMovimientoService: TipoMovimientoService,
    private metodoPagoservice: MetodoPagoService,
    private empleadoService: EmpleadoService,
    private dialogRef: MatDialogRef<CrearMovimientoComponent>,
    @Inject(MAT_DIALOG_DATA) public movimientoModel: Movimiento,
  ) {}

  ngOnInit(): void {
    this.listarCategorias();
    this.listarTiposMovimiento();
    this.listarMetodosPago();
    this.listarEmpleados();
    this.createForm();
    this.titulo = this.movimientoModel.idMovimiento! > 0 ? 'Editar' : 'Agregar';
  }

  createForm() {
    this.form = this.fb.group({
      valor: [this.movimientoModel.valor, [Validators.required]],
      fecha: [stringToDate(this.movimientoModel.fecha), [Validators.required]],
      idTipoMovimiento: [this.movimientoModel.idTipoMovimiento, [Validators.required]],
      idCategoriaMovimiento: [this.movimientoModel.idCategoriaMovimiento, [Validators.required]],
      idMetodoPago: [this.movimientoModel.idMetodoPago, [Validators.required]],
      tipoReferencia: [this.movimientoModel.tipoReferencia, [Validators.required]],
      idReferencia: [this.movimientoModel.idReferencia || null, [Validators.required]],
      observacion: [this.movimientoModel.observacion, null],
    });
  }

  get esNomina(): boolean {
    return this.form.get('tipoReferencia')?.value === 'Nómina';
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = { ...this.form.value };
    formValue.fecha = dateToString(formValue.fecha);
    Object.assign(this.movimientoModel, formValue);

    this.isLoading = true;

    const obs = this.movimientoModel.idMovimiento! > 0
      ? this.movimientoService.actualizar(this.movimientoModel)
      : this.movimientoService.crear(this.movimientoModel);

    obs.subscribe({
      next: () => { this.isLoading = false; this.dialogRef.close(true); },
      error: (err) => { this.isLoading = false; console.error(err); },
    });
  }

  listarCategorias() {
    this.categoriaService.listarCategoriasMovimiento().subscribe((resp: any) => {
      this.categorias = resp.categoriasMovimiento;
    });
  }

  listarMetodosPago() {
    this.metodoPagoservice.listarMetodosPago().subscribe((resp: any) => {
      this.metodosPago = resp.metodosPago;
    });
  }

  listarTiposMovimiento() {
    this.tipoMovimientoService.listarTiposMovimiento().subscribe((resp: any) => {
      this.tiposMovimiento = resp.tiposMovimiento;
    });
  }

  listarEmpleados() {
    this.empleadoService.getAll().subscribe((resp: any) => {
      this.empleados = resp.empleados ?? [];
    });
  }

  nombreEmpleado(idEmpleado: number): string {
    const emp = this.empleados.find((e) => e.idEmpleado === idEmpleado);
    return emp ? `${emp.nombres} ${emp.apellidos}` : '';
  }
}
