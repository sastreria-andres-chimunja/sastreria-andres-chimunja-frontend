import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { GarantiaService } from '../../../core/services/garantia.service';
import { AuthService } from '../../../core/services/auth.service';
import { dateToString } from '../../../utils/date.utils';
import { CrearGarantiaComponent } from '../crear-garantia/crear-garantia.component';

@Component({
  selector: 'app-garantias-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  templateUrl: './garantias-list.component.html',
  styleUrl: './garantias-list.component.css',
})
export class GarantiasListComponent implements OnInit {
  garantias: any[] = [];
  garantiasFiltradas: any[] = [];
  busqueda = '';

  filtroFechaAbierto = false;
  filtroFechaActivo = false;
  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);

  constructor(
    private garantiaService: GarantiaService,
    private dialog: MatDialog,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  // Operario y asistente solo ven sus propias garantías, Admin ve todas
  // (mismo criterio de visibilidad que tenía "Nómina" antes de que este
  // apartado la reemplazara en el menú).
  get soloPropia(): boolean {
    return this.authService.esOperario() || this.authService.esAsistente();
  }

  cargar(): void {
    const inicio = this.fechaInicioCtrl.value ? dateToString(this.fechaInicioCtrl.value) : undefined;
    const fin = this.fechaFinCtrl.value ? dateToString(this.fechaFinCtrl.value) : undefined;
    const idEmpleado = this.soloPropia ? this.authService.getIdEmpleado() ?? undefined : undefined;

    this.garantiaService.listar(inicio, fin, idEmpleado).subscribe((resp: any) => {
      this.garantias = resp.garantias ?? [];
      this.aplicarBusqueda();
    });
  }

  aplicarBusqueda(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.garantiasFiltradas = !q
      ? [...this.garantias]
      : this.garantias.filter((g) =>
          (g.nombreCliente ?? '').toLowerCase().includes(q) ||
          (g.nombreEmpleado ?? '').toLowerCase().includes(q),
        );
  }

  applyFilter(event: Event): void {
    this.busqueda = (event.target as HTMLInputElement).value;
    this.aplicarBusqueda();
  }

  toggleFiltroFecha(): void {
    this.filtroFechaAbierto = !this.filtroFechaAbierto;
  }

  aplicarFiltroFecha(): void {
    this.filtroFechaActivo = !!(this.fechaInicioCtrl.value || this.fechaFinCtrl.value);
    this.filtroFechaAbierto = false;
    this.cargar();
  }

  filtrarHoy(): void {
    const hoy = new Date();
    this.fechaInicioCtrl.setValue(hoy);
    this.fechaFinCtrl.setValue(hoy);
    this.aplicarFiltroFecha();
  }

  limpiarFiltroFecha(): void {
    this.fechaInicioCtrl.reset();
    this.fechaFinCtrl.reset();
    this.filtroFechaActivo = false;
    this.filtroFechaAbierto = false;
    this.cargar();
  }

  nuevaGarantia(): void {
    this.dialog.open(CrearGarantiaComponent, {
      width: '400px',
      autoFocus: false,
    }).afterClosed().subscribe((ok) => {
      if (ok) this.cargar();
    });
  }

  getInitials(nombre: string): string {
    return (nombre || '').split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }
}
