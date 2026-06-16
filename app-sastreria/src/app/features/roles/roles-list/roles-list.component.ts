import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { RolService } from '../../../core/services/rol.service';
import { Rol } from '../../../shared/models/Rol';
import { CrearRolComponent } from '../crear-rol/crear-rol.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.css',
})
export class RolesListComponent implements OnInit {
  roles: Rol[] = [];
  busqueda = '';

  constructor(private rolService: RolService, public dialog: MatDialog) {}

  ngOnInit() { this.loadRoles(); }

  loadRoles() {
    this.rolService.listarRoles().subscribe((resp: any) => {
      this.roles = resp.roles ?? [];
    });
  }

  get rolesFiltrados(): Rol[] {
    if (!this.busqueda.trim()) return this.roles;
    const q = this.busqueda.toLowerCase();
    return this.roles.filter(r => (r.nombre ?? '').toLowerCase().includes(q));
  }

  eliminarRol(rol: Rol) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el rol "${rol.nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (result.isConfirmed) {
        this.rolService.eliminar(rol).subscribe(() => {
          this.loadRoles();
          Swal.fire({ title: '¡Eliminado!', text: `El rol "${rol.nombre}" fue eliminado.`, icon: 'success', confirmButtonColor: '#2563eb' });
        });
      }
    });
  }

  openDialogRol(data?: Rol) {
    if (data?.idRol) {
      Swal.fire({
        title: '¿Editar rol?',
        text: `Se editará el rol "${data.nombre}"`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#185FA5',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Sí, editar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) {
          this.dialog.open(CrearRolComponent, {
            width: '400px', height: '350px', data,
          }).afterClosed().subscribe(() => this.loadRoles());
        }
      });
    } else {
      this.dialog.open(CrearRolComponent, {
        width: '400px', height: '350px', data: {},
      }).afterClosed().subscribe(() => this.loadRoles());
    }
  }
}
