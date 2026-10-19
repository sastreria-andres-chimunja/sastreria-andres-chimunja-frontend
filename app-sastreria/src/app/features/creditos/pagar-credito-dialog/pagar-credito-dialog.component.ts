import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { MetodoPagoService } from '../../../core/services/metodos-pago.service';
import { MetodoPago } from '../../../shared/models/MetodoPago';
import { Movimiento } from '../../../shared/models/Movimiento';
import Swal from 'sweetalert2';

export interface PagarCreditoDialogData {
  credito: Movimiento;
}

@Component({
  selector: 'app-pagar-credito-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './pagar-credito-dialog.component.html',
  styleUrl: './pagar-credito-dialog.component.css',
})
export class PagarCreditoDialogComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  // Métodos de pago elegibles para liquidar el crédito -- nunca "Crédito"
  // otra vez, sería dejarlo exactamente igual de pendiente.
  metodosPago: MetodoPago[] = [];

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoService,
    private metodoPagoService: MetodoPagoService,
    private dialogRef: MatDialogRef<PagarCreditoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PagarCreditoDialogData,
  ) {
    this.form = this.fb.group({
      idMetodoPago: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.metodoPagoService.listarMetodosPago().subscribe((resp: any) => {
      const todos: MetodoPago[] = resp.metodosPago ?? [];
      this.metodosPago = todos.filter(
        (m) => !(m.nombreMetodoPago ?? '').toLowerCase().includes('crédito')
             && !(m.nombreMetodoPago ?? '').toLowerCase().includes('credito'),
      );
    });
  }

  get credito(): Movimiento {
    return this.data.credito;
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const idMetodoPago = this.form.value.idMetodoPago;
    const nombreMetodo = this.metodosPago.find((m) => m.idMetodoPago === idMetodoPago)?.nombreMetodoPago ?? '';

    Swal.fire({
      title: '¿Dar de baja este crédito?',
      html: `Se registrará como pagado por <b>${nombreMetodo}</b>, por <b>${this.formatCOP(this.credito.valor)}</b>. Dejará de aparecer como crédito pendiente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#185FA5',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.isLoading = true;
      this.movimientoService.pagarCredito(this.credito.idMovimiento!, idMetodoPago).subscribe({
        next: () => {
          this.isLoading = false;
          Swal.fire({ title: '¡Crédito dado de baja!', icon: 'success', timer: 1800, showConfirmButton: false })
            .then(() => this.dialogRef.close(true));
        },
        error: (err) => {
          this.isLoading = false;
          Swal.fire({
            title: 'No se pudo dar de baja',
            text: err?.error?.error || 'Ocurrió un error inesperado.',
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        },
      });
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
