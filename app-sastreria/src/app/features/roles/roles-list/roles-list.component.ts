import { Component, OnInit, ViewChild } from '@angular/core';
import { RolService } from '../../../core/services/rol.service';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Rol } from '../../../shared/models/Rol';
import { CrearRolComponent } from '../crear-rol/crear-rol.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
  ],
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.css',
})
export class RolesListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'nombre', 'acciones'];
  dataSource!: MatTableDataSource<Rol>;
  isEmpty = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private rolService: RolService,
    public dialog: MatDialog,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.rolService.listarRoles().subscribe((resp: any) => {
      this.dataSource = new MatTableDataSource(resp.roles);
      this.isEmpty = resp.roles.length === 0;
      if (this.dataSource) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    });
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
    }).then((result) => {
      if (result.isConfirmed) {
        this.rolService.eliminar(rol).subscribe((resp: any) => {
          this.loadRoles();
          Swal.fire({
            title: '¡Eliminado!',
            text: `El rol "${rol.nombre}" fue eliminado correctamente.`,
            icon: 'success',
            confirmButtonColor: '#2563eb',
          });
        });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    console.log('filtro', filterValue);

    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  openDialogRol(data?: Rol) {
    const dialogRef = this.dialog.open(CrearRolComponent, {
      width: '400px',
      height: '350px',
      data: data == null ? {} : data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadRoles();
    });
  }
}
