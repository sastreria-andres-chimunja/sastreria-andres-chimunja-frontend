import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { MetodoPagoService } from '../../../core/services/metodos-pago.service';
import { MatSelectModule } from '@angular/material/select';
import { MetodoPago } from '../../../shared/models/MetodoPago';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-metodo-pago',
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
  templateUrl: './crear-metodo-pago.component.html',
  styleUrl: './crear-metodo-pago.component.css',
})
export class CrearMetodoPagoComponent implements OnInit {
  form!: FormGroup;
  metodo = new MetodoPago();
  isLoading = false;
  titulo = '';
  icono = '';

  constructor(
    private fb: FormBuilder,
    private metodoPagoService: MetodoPagoService,
    private dialogRef: MatDialogRef<CrearMetodoPagoComponent>,
    @Inject(MAT_DIALOG_DATA) public metodoPagoModel: MetodoPago,
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.titulo = this.metodoPagoModel.idMetodoPago! > 0 ? 'Editar' : 'Agregar';
    this.icono =
      this.metodoPagoModel.idMetodoPago! > 0 ? 'create' : 'person_add';
  }

  createForm() {
    this.form = this.fb.group({
      nombreMetodoPago: [
        this.metodoPagoModel.nombreMetodoPago,
        [Validators.required],
      ],
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Mapear valores del form al modelo
    Object.assign(this.metodoPagoModel, this.form.value);

    this.isLoading = true;
    console.log('id1', this.metodoPagoModel.idMetodoPago);

    if (this.metodoPagoModel.idMetodoPago! > 0) {
      console.log('id3', this.metodoPagoModel.idMetodoPago);

      this.metodoPagoService.actualizar(this.metodoPagoModel).subscribe({
        next: () => {
          this.isLoading = false;
          Swal.fire({ title: '¡Método editado!', icon: 'success', timer: 1800, showConfirmButton: false })
            .then(() => this.dialogRef.close(true));
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar método de pago:', err);
        },
      });
    } else {
      this.metodoPagoService.crear(this.metodoPagoModel).subscribe({
        next: () => {
          this.isLoading = false;
          Swal.fire({ title: '¡Método de pago creado!', icon: 'success', timer: 1800, showConfirmButton: false })
            .then(() => this.dialogRef.close(true));
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar método de pago:', err);
        },
      });
    }
  }
}
