import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NominaService } from '../../../core/services/nomina.service';
import { Nomina } from '../../../shared/models/Nomina';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { dateToString } from '../../../utils/date.utils';
import { NominaDetalleDialogComponent } from '../nomina-detalle-dialog/nomina-detalle-dialog.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-nomina-general',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatTooltipModule,
    MatDatepickerModule,
  ],
  templateUrl: './nomina-general.component.html',
  styleUrl: './nomina-general.component.css',
})
export class NominaGeneralComponent implements OnInit {
  balance: Nomina[] = [];
  balanceFiltrado: any[] = [];

  filtroFechaAbierto = false;
  filtroFechaActivo = false;

  fechaInicioCtrl = new FormControl<Date | null>(null);
  fechaFinCtrl = new FormControl<Date | null>(null);

  constructor(
    private nominaService: NominaService,
    private dialog: MatDialog,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.traerBalance();
  }

  // Operario y asistente solo ven su propia nómina, Admin ve todas
  get soloPropia(): boolean { return this.authService.esOperario() || this.authService.esAsistente(); }
  get puedeVerDetalle(): boolean { return true; }
  get puedePagar(): boolean { return this.authService.esAdmin(); }

  applyFilter(event: Event): void {
    const valor = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.balanceFiltrado = this.balance.filter((emp) =>
      `${emp.nombres} ${emp.apellidos}`.toLowerCase().includes(valor),
    );
  }

  toggleFiltroFecha(): void {
    this.filtroFechaAbierto = !this.filtroFechaAbierto;
  }

  aplicarFiltroFecha(): void {
    this.filtroFechaActivo = !!(this.fechaInicioCtrl.value || this.fechaFinCtrl.value);
    this.filtroFechaAbierto = false;
    this.traerBalance();
  }

  /** Atajo: filtra por la fecha de hoy (desde y hasta = hoy). */
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
    this.traerBalance();
  }

  traerBalance() {
    const inicio = this.fechaInicioCtrl.value ? dateToString(this.fechaInicioCtrl.value) : undefined;
    const fin = this.fechaFinCtrl.value ? dateToString(this.fechaFinCtrl.value) : undefined;

    if (this.soloPropia) {
      // Operario/asistente: solo su propia nómina.
      const idEmpleado = this.authService.getIdEmpleado();
      if (!idEmpleado) return;
      const historial = !!(inicio || fin);
      this.nominaService.nominaEmpleado(idEmpleado, inicio, fin, historial).subscribe((resp: any) => {
        const detalle = resp.nominaEmpleado;
        if (detalle) {
          this.balance = [{
            ...detalle.empleado,
            totalEntradas: detalle.entradas.total,
            totalSalidas: detalle.salidas.total,
            saldo: detalle.saldo,
          }];
          this.balanceFiltrado = [...this.balance];
        }
      });
    } else {
      this.nominaService.nominaGeneral(inicio, fin).subscribe((resp: any) => {
        this.balance = resp.nominaGeneral;
        this.balanceFiltrado = [...this.balance];
      });
    }
  }

  verDetalle(emp: any): void {
    const inicio = this.fechaInicioCtrl.value ? dateToString(this.fechaInicioCtrl.value) : undefined;
    const fin = this.fechaFinCtrl.value ? dateToString(this.fechaFinCtrl.value) : undefined;

    this.dialog.open(NominaDetalleDialogComponent, {
      data: {
        idEmpleado: emp.idEmpleado,
        nombres: emp.nombres,
        apellidos: emp.apellidos,
        telefono: emp.telefono,
        fechaInicio: inicio,
        fechaFin: fin,
        soloLectura: !this.puedePagar,
        historial: !!(inicio || fin),
      },
      panelClass: 'nomina-dialog-panel',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
    });
  }

  getInitials(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }
}
