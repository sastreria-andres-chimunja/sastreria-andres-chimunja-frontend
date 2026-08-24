import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface ConfirmarEntregaDialogData {
  idPedido: number;
  saldo: number;
  metodosPago: any[];
}

/**
 * Se abre justo antes de marcar un pedido como "Entregado" cuando todavía
 * queda saldo pendiente -- el saldo se va a consolidar automáticamente en
 * un abono, pero primero hay que saber CÓMO se pagó ese saldo. Con opción
 * de cancelar por si el usuario entregó el pedido por error.
 * Devuelve el idMetodoPago elegido si se confirma, o `null` si se cancela
 * (el llamador debe abortar todo el guardado, no solo el abono).
 */
@Component({
  selector: 'app-confirmar-entrega-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './confirmar-entrega-dialog.component.html',
  styleUrl: './confirmar-entrega-dialog.component.css',
})
export class ConfirmarEntregaDialogComponent {
  idMetodoPagoCtrl = new FormControl<number | null>(null, Validators.required);

  constructor(
    public dialogRef: MatDialogRef<ConfirmarEntregaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmarEntregaDialogData,
  ) {}

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }

  confirmar(): void {
    if (this.idMetodoPagoCtrl.invalid) {
      this.idMetodoPagoCtrl.markAsTouched();
      return;
    }
    this.dialogRef.close(this.idMetodoPagoCtrl.value);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
