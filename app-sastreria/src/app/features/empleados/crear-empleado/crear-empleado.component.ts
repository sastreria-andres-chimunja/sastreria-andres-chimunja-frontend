import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogRef,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Empleado } from '../../../shared/models/Empleado';
import { Rol } from '../../../shared/models/Rol';
import { RolService } from '../../../core/services/rol.service';
import { MatSelectModule } from '@angular/material/select';
import { dateToString, stringToDate } from '../../../utils/date.utils';

@Component({
  selector: 'app-crear-empleado',
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
    MatDatepickerModule,
    MatSelectModule,
  ],
  templateUrl: './crear-empleado.component.html',
  styleUrl: './crear-empleado.component.css',
})
export class CrearEmpleadoComponent implements OnInit {
  form!: FormGroup;
  empleado = new Empleado();
  isLoading = false;
  titulo = '';
  icono = '';
  roles: Rol[] = [];

  constructor(
    private fb: FormBuilder,
    private empleadoService: EmpleadoService,
    private rolService: RolService,
    private dialogRef: MatDialogRef<CrearEmpleadoComponent>,
    @Inject(MAT_DIALOG_DATA) public empleadoModel: Empleado,
  ) {}

  ngOnInit(): void {
    this.listarRoles();
    this.createForm();
    this.titulo = this.empleadoModel.idEmpleado! > 0 ? 'Editar' : 'Agregar';
    this.icono = this.empleadoModel.idEmpleado! > 0 ? 'create' : 'person_add';
  }

  createForm() {
    this.form = this.fb.group({
      nombres: [this.empleadoModel.nombres, [Validators.required]],
      apellidos: [this.empleadoModel.apellidos, [Validators.required]],
      fechaCumpleanios: [
        stringToDate(this.empleadoModel.fechaCumpleanios),
        [Validators.required],
      ],
      telefono: [this.empleadoModel.telefono, [Validators.required]],
      direccion: [this.empleadoModel.direccion, [Validators.required]],
      idRol: [this.empleadoModel.idRol, [Validators.required]],
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = { ...this.form.value };
    formValue.fechaCumpleanios = dateToString(formValue.fechaCumpleanios);
    Object.assign(this.empleadoModel, formValue);

    this.isLoading = true;

    if (this.empleadoModel.idEmpleado! > 0) {
      this.empleadoService.actualizar(this.empleadoModel).subscribe({
        next: () => {
          this.isLoading = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar empleado:', err);
        },
      });
    } else {
      this.empleadoService.crear(this.empleadoModel).subscribe({
        next: () => {
          this.isLoading = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar empleado:', err);
        },
      });
    }
  }

  listarRoles() {
    this.rolService.listarRoles().subscribe((resp: any) => {
      this.roles = resp.roles;
    });
  }
}
