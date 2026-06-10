import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Empleado } from '../../../shared/models/Empleado';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CrearEmpleadoComponent } from '../crear-empleado/crear-empleado.component';
import { CrearMovimientoComponent } from '../../movimientos/crear-movimiento/crear-movimiento.component';
import { Movimiento } from '../../../shared/models/Movimiento';

@Component({
  selector: 'app-empleados-list',
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
  templateUrl: './empleados-list.component.html',
  styleUrl: './empleados-list.component.css',
})
export class EmpleadosListComponent implements OnInit {
  displayedColumns: string[] = [
    'id',
    'nombres',
    'telefono',
    'fechaCumpleanios',
    'acciones',
  ];
  dataSource!: MatTableDataSource<Empleado>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private EmpleadoService: EmpleadoService,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.loadEmpleados();
  }

  loadEmpleados() {
    this.EmpleadoService.getAll().subscribe((resp: any) => {
      this.dataSource = new MatTableDataSource(resp.empleados);
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
  openDialog(data?: Empleado) {
    const dialogRef = this.dialog.open(CrearEmpleadoComponent, {
      width: '400px',
      height: '600px',
      data: data == null ? {} : data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadEmpleados();
    });
  }
  openDialogMovimiento(data?: Empleado) {
    let newMovement = new Movimiento();

    newMovement.idReferencia = Number(data?.idEmpleado);
    newMovement.tipoReferencia = 'empleado';
    newMovement.observacion = `Abono de nómina a ${data?.nombres} ${data?.apellidos}`;
    const dialogRef = this.dialog.open(CrearMovimientoComponent, {
      width: '400px',
      height: '600px',
      data: newMovement == null ? {} : newMovement,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadEmpleados();
    });
  }
  // openDialogMedida(data?: Empleado) {
  //   const dialogRef = this.dialog.open(MedidaFormComponent, {
  //     width: '500px',
  //     height: '500px',
  //     data: data == null ? {} : data,
  //   });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     this.loadEmpleados();
  //   });
  // }
}
