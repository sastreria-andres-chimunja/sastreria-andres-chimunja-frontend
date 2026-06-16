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
import { Rol } from '../../../shared/models/Rol';
import { RolService } from '../../../core/services/rol.service';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-rol',
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
  ],
  templateUrl: './crear-rol.component.html',
  styleUrl: './crear-rol.component.css',
})
export class CrearRolComponent implements OnInit {
  form!: FormGroup;
  rol = new Rol();
  isLoading = false;
  titulo = '';
  icono = '';

  constructor(
    private fb: FormBuilder,
    private rolService: RolService,
    private dialogRef: MatDialogRef<CrearRolComponent>,
    @Inject(MAT_DIALOG_DATA) public rolModel: Rol,
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.titulo = this.rolModel.idRol! > 0 ? 'Editar' : 'Agregar';
    this.icono = this.rolModel.idRol! > 0 ? 'create' : 'person_add';
  }

  createForm() {
    this.form = this.fb.group({
      nombre: [this.rolModel.nombre, [Validators.required]],
      descripcion: [this.rolModel.descripcion, [Validators.required]],
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Mapear valores del form al modelo
    Object.assign(this.rolModel, this.form.value);

    this.isLoading = true;
    console.log('id1', this.rolModel.idRol);

    if (this.rolModel.idRol! > 0) {
      console.log('id3', this.rolModel.idRol);

      this.rolService.actualizar(this.rolModel).subscribe({
        next: () => {
          this.isLoading = false;
          Swal.fire({ title: '¡Rol editado!', icon: 'success', timer: 1800, showConfirmButton: false })
            .then(() => this.dialogRef.close(true));
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar rol:', err);
        },
      });
    } else {
      this.rolService.crear(this.rolModel).subscribe({
        next: () => {
          this.isLoading = false;
          Swal.fire({ title: '¡Rol creado!', icon: 'success', timer: 1800, showConfirmButton: false })
            .then(() => this.dialogRef.close(true));
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar rol:', err);
        },
      });
    }
  }
}
