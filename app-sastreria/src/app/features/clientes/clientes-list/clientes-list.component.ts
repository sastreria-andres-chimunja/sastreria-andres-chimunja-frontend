import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ClienteService } from '../../../core/services/cliente.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Cliente } from '../../../shared/models/Cliente';
import { CrearClienteComponent } from '../crear-cliente/crear-cliente.component';
import { MatDialog } from '@angular/material/dialog';
import { MedidaFormComponent } from '../../medidas/medida-form/medida-form.component';

@Component({
  selector: 'app-clientes-list',
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
  ],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.css',
})
export class ClientesListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'cc', 'nombres', 'telefono', 'acciones'];
  dataSource!: MatTableDataSource<Cliente>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clienteService: ClienteService,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.loadClientes();
  }

  loadClientes() {
    this.clienteService.getAll().subscribe((resp: any) => {
      this.dataSource = new MatTableDataSource(resp.clientes);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  openDialog(data?: Cliente) {
    console.log('data', data);

    const dialogRef = this.dialog.open(CrearClienteComponent, {
      width: '400px',
      height: '500px',
      data: data == null ? {} : data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadClientes();
    });
  }
  openDialogMedida(data?: Cliente) {
    const dialogRef = this.dialog.open(MedidaFormComponent, {
      width: '500px',
      height: '500px',
      data: data == null ? {} : data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadClientes();
    });
  }
}
