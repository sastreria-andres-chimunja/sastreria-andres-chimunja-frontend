import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MedidaService } from '../../../core/services/medida.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { MedidaFormComponent } from '../../medidas/medida-form/medida-form.component';
import { Medida } from '../../../shared/models/Medida';
import { Cliente } from '../../../shared/models/Cliente';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-medidas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './medidas-list.component.html',
  styleUrl: './medidas-list.component.css',
})
export class MedidasListComponent implements OnInit {
  medidas: Medida[] = [];
  cliente: Cliente = new Cliente();
  idCliente = 0;
  busqueda = '';

  constructor(
    private MedidaService: MedidaService,
    private clienteService: ClienteService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.idCliente = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCliente();
    this.loadMedidas();
  }

  loadMedidas() {
    this.MedidaService.listarMedidasPorCliente(this.idCliente).subscribe((resp: any) => {
      this.medidas = resp.medidas ?? [];
    });
  }

  loadCliente() {
    this.clienteService.buscarPorId(this.idCliente).subscribe((resp: any) => {
      this.cliente = resp.cliente;
    });
  }

  get medidasFiltradas(): Medida[] {
    if (!this.busqueda.trim()) return this.medidas;
    const q = this.busqueda.toLowerCase();
    return this.medidas.filter(m =>
      (m.tipoPrenda ?? '').toLowerCase().includes(q) ||
      (m.observaciones ?? '').toLowerCase().includes(q)
    );
  }

  iconoPorTipo(tipo: string): string {
    const t = (tipo ?? '').toLowerCase();
    if (t.includes('camisa') || t.includes('chaqueta') || t.includes('saco')) return 'dry_cleaning';
    if (t.includes('pant') || t.includes('jean')) return 'airline_seat_legroom_extra';
    return 'straighten';
  }

  openDialogMedida(data?: Medida) {
    if (data?.idMedida) {
      Swal.fire({
        title: '¿Editar medida?',
        text: `Se editará la medida de ${data.tipoPrenda || 'prenda sin tipo'}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#185FA5',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Sí, editar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) {
          this.dialog.open(MedidaFormComponent, {
            width: '500px', height: '500px',
            data: { ...data, idCliente: this.idCliente },
          }).afterClosed().subscribe(() => this.loadMedidas());
        }
      });
    } else {
      this.dialog.open(MedidaFormComponent, {
        width: '500px', height: '500px',
        data: { idCliente: this.idCliente },
      }).afterClosed().subscribe(() => this.loadMedidas());
    }
  }
}
