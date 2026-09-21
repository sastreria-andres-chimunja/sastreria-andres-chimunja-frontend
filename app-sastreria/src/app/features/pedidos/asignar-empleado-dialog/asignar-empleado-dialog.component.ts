import { Component, Inject, OnInit } from '@angular/core';
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
export class AsignarEmpleadoDialogComponent implements OnInit {
  idEmpleadoSeleccionado: number | null = null;
  guardando = false;

  // Cupo diario disponible (capacidad de trabajo asignable HOY) -- se
  // recarga después de asignar, para que quede al día si el usuario sigue
  // asignando otros pedidos sin cerrar/reabrir el diálogo.
  cupo: { limite: number; asignadoHoy: number; disponible: number } | null = null;

  constructor(
    public dialogRef: MatDialogRef<AsignarEmpleadoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AsignarEmpleadoDialogData,
    private itemPedidoService: ItemPedidoService,
  ) {}

  ngOnInit(): void {
    this.cargarCupo();
  }

  private cargarCupo(): void {
    this.itemPedidoService.getCupoDia().subscribe({
      next: (r) => { this.cupo = r; },
      error: () => { this.cupo = null; },
    });
  }

  seleccionar(idEmpleado: number): void {
    this.idEmpleadoSeleccionado = idEmpleado;
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
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
      error: (err) => {
        this.guardando = false;
        this.cargarCupo();
        // forkJoin no revierte las llamadas que ya habían tenido éxito antes
        // de que una fallara (p. ej. cupo superado en el 3er ítem de 5) --
        // se avisa explícitamente para que el usuario revise qué quedó
        // asignado, en vez de un fallo silencioso como antes.
        Swal.fire({
          title: 'No se pudo asignar todo',
          text: err?.error?.error || 'Revisa qué ítems quedaron asignados antes de reintentar.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
