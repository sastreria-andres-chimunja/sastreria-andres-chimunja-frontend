import { Component, OnInit, ViewChild } from '@angular/core';
import { MetodoPagoService } from '../../../core/services/metodos-pago.service';
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
import { CrearMetodoPagoComponent } from '../crear-metodo-pago/crear-metodo-pago.component';
import Swal from 'sweetalert2';
import { MetodoPago } from '../../../shared/models/MetodoPago';

@Component({
  selector: 'app-metodos-pago-list',
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
  templateUrl: './metodos-pago-list.component.html',
  styleUrl: './metodos-pago-list.component.css',
})
export class MetodosPagoListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'nombre', 'acciones'];
  dataSource!: MatTableDataSource<MetodoPago>;
  isEmpty = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private metodoPagoService: MetodoPagoService,
    public dialog: MatDialog,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.loadMetodosPago();
  }

  loadMetodosPago() {
    this.metodoPagoService.listarMetodosPago().subscribe((resp: any) => {
      this.dataSource = new MatTableDataSource(resp.metodosPago);
      this.isEmpty = resp.metodosPago.length === 0;
      if (this.dataSource) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    });
  }
  eliminarMetodoPago(metodoPago: MetodoPago) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el metodoPago "${metodoPago.nombreMetodoPago}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.metodoPagoService.eliminar(metodoPago).subscribe((resp: any) => {
          this.loadMetodosPago();
          Swal.fire({
            title: '¡Eliminado!',
            text: `El metodoPago "${metodoPago.nombreMetodoPago}" fue eliminado correctamente.`,
            icon: 'success',
            confirmButtonColor: '#2563eb',
          });
        });
      }
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  openDialog(data?: MetodoPago) {
    const dialogRef = this.dialog.open(CrearMetodoPagoComponent, {
      width: '400px',
      height: '350px',
      data: data == null ? {} : data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadMetodosPago();
    });
  }
}
