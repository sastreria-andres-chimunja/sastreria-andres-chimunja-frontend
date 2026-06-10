import { Component, OnInit, ViewChild } from '@angular/core';
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
import Swal from 'sweetalert2';
import { CategoriaMovimiento } from '../../../shared/models/CategoriaMovimiento';
import { CategoriaMovimientoService } from '../../../core/services/categoria-movimiento.service';
import { CrearCategoriaMovimientoComponent } from '../crear-categoria-movimiento/crear-categoria-movimiento.component';

@Component({
  selector: 'app-categoria-movimiento-list',
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
  templateUrl: './categoria-movimiento-list.component.html',
  styleUrl: './categoria-movimiento-list.component.css',
})
export class CategoriaMovimientoListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'nombre', 'acciones'];
  dataSource!: MatTableDataSource<CategoriaMovimiento>;
  isEmpty = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private categoriaMovimientoService: CategoriaMovimientoService,
    public dialog: MatDialog,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.loadCategorias();
  }

  loadCategorias() {
    this.categoriaMovimientoService
      .listarCategoriasMovimiento()
      .subscribe((resp: any) => {
        this.dataSource = new MatTableDataSource(resp.categoriasMovimiento);
        this.isEmpty = resp.categoriasMovimiento.length === 0;
        if (this.dataSource) {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        }
      });
  }

  eliminar(categoria: CategoriaMovimiento) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la categoría "${categoria.nombreCategoriaMovimiento}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoriaMovimientoService
          .eliminar(categoria)
          .subscribe((resp: any) => {
            this.loadCategorias();
            Swal.fire({
              title: '¡Eliminado!',
              text: `La categoría "${categoria.nombreCategoriaMovimiento}" fue eliminado correctamente.`,
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
  openDialog(data?: CategoriaMovimiento) {
    const dialogRef = this.dialog.open(CrearCategoriaMovimientoComponent, {
      width: '400px',
      height: '350px',
      data: data == null ? {} : data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadCategorias();
    });
  }
}
