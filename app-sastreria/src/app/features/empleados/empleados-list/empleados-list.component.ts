import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { Empleado } from '../../../shared/models/Empleado';
import { CrearEmpleadoComponent } from '../crear-empleado/crear-empleado.component';
import { CrearMovimientoComponent } from '../../movimientos/crear-movimiento/crear-movimiento.component';
import { Movimiento } from '../../../shared/models/Movimiento';
import Swal from 'sweetalert2';

type TabEstado = 'activos' | 'inactivos';

@Component({
  selector: 'app-empleados-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './empleados-list.component.html',
  styleUrl: './empleados-list.component.css',
})
export class EmpleadosListComponent implements OnInit {
  empleados: Empleado[] = [];
  busqueda = '';
  tabEstado: TabEstado = 'activos';

  constructor(private EmpleadoService: EmpleadoService, public dialog: MatDialog) {}

  ngOnInit() { this.loadEmpleados(); }

  loadEmpleados() {
    this.EmpleadoService.getAll().subscribe((resp: any) => {
      this.empleados = resp.empleados ?? [];
    });
  }

  cambiarTab(tab: TabEstado): void {
    this.tabEstado = tab;
  }

  get countActivos(): number {
    return this.empleados.filter((e) => e.activo).length;
  }

  get countInactivos(): number {
    return this.empleados.filter((e) => !e.activo).length;
  }

  get empleadosFiltrados(): Empleado[] {
    let resultado = this.empleados.filter((e) =>
      this.tabEstado === 'activos' ? !!e.activo : !e.activo
    );
    const q = this.busqueda.toLowerCase().trim();
    if (q) {
      resultado = resultado.filter(e =>
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q) ||
        (e.telefono ?? '').toLowerCase().includes(q) ||
        (e.username ?? '').toLowerCase().includes(q)
      );
    }
    return resultado;
  }

  initials(e: Empleado): string {
    return `${e.nombres?.[0] ?? ''}${e.apellidos?.[0] ?? ''}`.toUpperCase();
  }

  openDialog(data?: Empleado) {
    if (data?.idEmpleado) {
      Swal.fire({
        title: '¿Editar empleado?',
        text: `Se editará la información de ${data.nombres} ${data.apellidos}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#185FA5',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Sí, editar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) {
          this.dialog.open(CrearEmpleadoComponent, {
            width: '400px', height: '600px', data,
          }).afterClosed().subscribe(() => this.loadEmpleados());
        }
      });
    } else {
      this.dialog.open(CrearEmpleadoComponent, {
        width: '400px', height: '600px', data: {},
      }).afterClosed().subscribe(() => this.loadEmpleados());
    }
  }

  openDialogMovimiento(data?: Empleado) {
    const mov = new Movimiento();
    mov.idReferencia = Number(data?.idEmpleado);
    mov.tipoReferencia = 'empleado';
    mov.observacion = `Abono de nómina a ${data?.nombres} ${data?.apellidos}`;
    this.dialog.open(CrearMovimientoComponent, {
      width: '400px', height: '600px', data: mov,
    }).afterClosed().subscribe(() => this.loadEmpleados());
  }

  cambiarEstado(e: Empleado) {
    const nombre = `${e.nombres} ${e.apellidos}`;
    const activar = !e.activo;
    Swal.fire({
      title: activar ? '¿Activar empleado?' : '¿Inactivar empleado?',
      text: activar
        ? `${nombre} volverá a estar disponible para asignarle trabajo.`
        : `${nombre} ya no podrá ser asignado a nuevos trabajos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: activar ? '#185FA5' : '#d33',
      cancelButtonColor: '#6B7280',
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, inactivar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (result.isConfirmed) {
        this.EmpleadoService.cambiarEstado(e.idEmpleado!, activar).subscribe(() => {
          this.loadEmpleados();
          Swal.fire({
            title: activar ? '¡Activado!' : '¡Inactivado!',
            text: `${nombre} quedó ${activar ? 'activo' : 'inactivo'}.`,
            icon: 'success',
            confirmButtonColor: '#2563eb',
          });
        });
      }
    });
  }
}
