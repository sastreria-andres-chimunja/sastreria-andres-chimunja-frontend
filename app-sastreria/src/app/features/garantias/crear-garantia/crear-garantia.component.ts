import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GarantiaService } from '../../../core/services/garantia.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-garantia',
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
  ],
  templateUrl: './crear-garantia.component.html',
  styleUrl: './crear-garantia.component.css',
})
export class CrearGarantiaComponent {
  form: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private garantiaService: GarantiaService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<CrearGarantiaComponent>,
  ) {
    this.form = this.fb.group({
      nombreCliente: ['', [Validators.required]],
      valor: [null, [Validators.required, Validators.min(1)]],
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const idEmpleado = this.authService.getIdEmpleado();
    if (!idEmpleado) return;

    const { nombreCliente, valor } = this.form.value;
    this.isLoading = true;
    this.garantiaService.crear(idEmpleado, nombreCliente, valor).subscribe({
      next: () => {
        this.isLoading = false;
        Swal.fire({ title: '¡Garantía registrada!', icon: 'success', timer: 1800, showConfirmButton: false })
          .then(() => this.dialogRef.close(true));
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({
          title: 'No se pudo registrar',
          text: err?.error?.error || 'Ocurrió un error inesperado.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
