import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { Movimiento } from '../../../shared/models/Movimiento';
import { PagarCreditoDialogComponent } from '../pagar-credito-dialog/pagar-credito-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-creditos-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './creditos-list.component.html',
  styleUrl: './creditos-list.component.css',
})
export class CreditosListComponent implements OnInit {
  creditos: Movimiento[] = [];
  creditosFiltrados: Movimiento[] = [];
  busqueda = '';
  cargando = false;

  constructor(
    private movimientoService: MovimientoService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.movimientoService.listarCreditosPendientes().subscribe({
      next: (resp: any) => {
        this.creditos = resp.creditos ?? [];
        this.aplicarBusqueda();
        this.cargando = false;
      },
      error: () => { this.cargando = false; },
    });
  }

  aplicarBusqueda(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.creditosFiltrados = !q
      ? [...this.creditos]
      : this.creditos.filter((c) =>
          (c.nombreClienteReferencia ?? '').toLowerCase().includes(q) ||
          String(c.idReferencia ?? '').includes(q),
        );
  }

  onBusqueda(event: Event): void {
    this.busqueda = (event.target as HTMLInputElement).value;
    this.aplicarBusqueda();
  }

  pagarCredito(credito: Movimiento): void {
    this.dialog.open(PagarCreditoDialogComponent, {
      data: { credito },
      width: '420px',
      autoFocus: false,
    }).afterClosed().subscribe((ok) => {
      if (ok) this.cargar();
    });
  }

  /**
   * Deshace un crédito todavía sin pagar. Si salió de entregar el pedido,
   * el backend devuelve el pedido a Terminado con el saldo pendiente otra
   * vez (mismo "Revertir" de la Hoja de trabajo); si era un abono manual
   * con método Crédito, solo borra ese movimiento.
   */
  reversarCredito(credito: Movimiento): void {
    const esDeEntrega = !!credito.autoGenerado && credito.tipoReferencia === 'pedido';
    Swal.fire({
      title: '¿Reversar este crédito?',
      html:
        `Crédito de <b>${credito.nombreClienteReferencia || 'Sin cliente'}</b> por <b>${this.formatCOP(credito.valor)}</b>.<br><br>` +
        (esDeEntrega
          ? `El pedido #${credito.idReferencia} volverá a <b>Terminado</b> y el saldo quedará pendiente otra vez, para entregarlo de nuevo con el método de pago correcto.`
          : 'Se eliminará este movimiento de crédito.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, reversar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.movimientoService.reversarCredito(credito.idMovimiento!).subscribe({
        next: () => {
          this.cargar();
          Swal.fire({
            title: 'Crédito reversado',
            text: esDeEntrega
              ? `El pedido #${credito.idReferencia} volvió a Terminado.`
              : 'El movimiento de crédito se eliminó.',
            icon: 'success',
            confirmButtonColor: '#2563eb',
          });
        },
        error: (err) => {
          Swal.fire({
            title: 'No se pudo reversar',
            text: err?.error?.error ?? 'Ocurrió un error inesperado.',
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        },
      });
    });
  }

  get totalCreditos(): number {
    return this.creditosFiltrados.reduce((s, c) => s + Number(c.valor ?? 0), 0);
  }

  getInitials(nombre: string): string {
    return (nombre || '?').split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }
}
