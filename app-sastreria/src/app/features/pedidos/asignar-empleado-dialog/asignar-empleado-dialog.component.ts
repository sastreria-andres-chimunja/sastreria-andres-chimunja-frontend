import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { ItemPedidoService } from '../../../core/services/item-pedido.service';
import { Empleado } from '../../../shared/models/Empleado';
import Swal from 'sweetalert2';

export interface AsignarEmpleadoDialogData {
  idPedido: number;
  nombreCliente: string;
  items: { idItemPedido: number; descripcion: string }[];
  empleados: Empleado[];
}

@Component({
  selector: 'app-asignar-empleado-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './asignar-empleado-dialog.component.html',
  styleUrl: './asignar-empleado-dialog.component.css',
})
export class AsignarEmpleadoDialogComponent {
  idEmpleadoSeleccionado: number | null = null;
  guardando = false;

  constructor(
    public dialogRef: MatDialogRef<AsignarEmpleadoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AsignarEmpleadoDialogData,
    private itemPedidoService: ItemPedidoService,
  ) {}

  seleccionar(idEmpleado: number): void {
    this.idEmpleadoSeleccionado = idEmpleado;
  }

  getInitials(nombre: string): string {
    return (nombre ?? '??')
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  confirmar(): void {
    if (!this.idEmpleadoSeleccionado || this.data.items.length === 0) return;

    this.guardando = true;
    const llamadas = this.data.items.map((it) =>
      this.itemPedidoService.asignarEmpleado(it.idItemPedido, this.idEmpleadoSeleccionado!),
    );

    forkJoin(llamadas.length ? llamadas : [of(null)]).subscribe({
      next: () => {
        this.guardando = false;
        Swal.fire({ title: '¡Empleado asignado!', icon: 'success', timer: 1800, showConfirmButton: false })
          .then(() => this.dialogRef.close(true));
      },
      error: () => { this.guardando = false; },
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
