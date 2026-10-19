import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { Movimiento } from '../../../shared/models/Movimiento';
import { PagarCreditoDialogComponent } from '../pagar-credito-dialog/pagar-credito-dialog.component';

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
