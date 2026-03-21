import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MedidaService } from '../../../core/services/medida.service';
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
import { MedidaFormComponent } from '../../medidas/medida-form/medida-form.component';
import { Medida } from '../../../shared/models/Medida';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../shared/models/Cliente';

@Component({
  selector: 'app-medidas-list',
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
  templateUrl: './medidas-list.component.html',
  styleUrl: './medidas-list.component.css',
})
export class MedidasListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'tipoPrenda', 'fecha', 'acciones'];
  dataSource!: MatTableDataSource<Medida>;
  idCliente = 0;
  cliente: Cliente = new Cliente();
  isEmpty = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private MedidaService: MedidaService,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private clienteService: ClienteService,
  ) {}

  ngOnInit() {
    this.idCliente = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCliente();
    this.loadMedidas();
  }

  loadMedidas() {
    this.MedidaService.listarMedidasPorCliente(this.idCliente).subscribe(
      (resp: any) => {
        this.dataSource = new MatTableDataSource(resp.medidas);
        this.isEmpty = resp.medidas.length === 0;
        if (this.dataSource) {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        }
      },
    );
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  openDialogMedida(data?: Medida) {
    const dialogRef = this.dialog.open(MedidaFormComponent, {
      width: '500px',
      height: '500px',
      data: data
        ? { ...data, idCliente: this.idCliente } // editar — mezcla data + idCliente
        : { idCliente: this.idCliente }, // crear — solo idCliente
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.loadMedidas();
    });
  }
  loadCliente() {
    this.clienteService.buscarPorId(this.idCliente).subscribe((resp: any) => {
      this.cliente = resp.cliente;
    });
  }
}
