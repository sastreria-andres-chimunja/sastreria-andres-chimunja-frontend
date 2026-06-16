import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MetodoPagoService } from '../../../core/services/metodos-pago.service';
import { MetodoPago } from '../../../shared/models/MetodoPago';
import { CrearMetodoPagoComponent } from '../crear-metodo-pago/crear-metodo-pago.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-metodos-pago-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './metodos-pago-list.component.html',
  styleUrl: './metodos-pago-list.component.css',
})
export class MetodosPagoListComponent implements OnInit {
  metodosPago: MetodoPago[] = [];
  busqueda = '';

  constructor(private metodoPagoService: MetodoPagoService, public dialog: MatDialog) {}

  ngOnInit() { this.loadMetodosPago(); }

  loadMetodosPago() {
    this.metodoPagoService.listarMetodosPago().subscribe((resp: any) => {
      this.metodosPago = resp.metodosPago ?? [];
    });
  }

  get metodosFiltrados(): MetodoPago[] {
    if (!this.busqueda.trim()) return this.metodosPago;
    const q = this.busqueda.toLowerCase();
    return this.metodosPago.filter(m => (m.nombreMetodoPago ?? '').toLowerCase().includes(q));
  }

  eliminarMetodoPago(m: MetodoPago) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará "${m.nombreMetodoPago}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (result.isConfirmed) {
        this.metodoPagoService.eliminar(m).subscribe(() => {
          this.loadMetodosPago();
          Swal.fire({ title: '¡Eliminado!', text: `"${m.nombreMetodoPago}" fue eliminado.`, icon: 'success', confirmButtonColor: '#2563eb' });
        });
      }
    });
  }

  openDialog(data?: MetodoPago) {
    if (data?.idMetodoPago) {
      Swal.fire({
        title: '¿Editar método de pago?',
        text: `Se editará "${data.nombreMetodoPago}"`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#185FA5',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Sí, editar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) {
          this.dialog.open(CrearMetodoPagoComponent, {
            width: '400px', height: '250px', data,
          }).afterClosed().subscribe(() => this.loadMetodosPago());
        }
      });
    } else {
      this.dialog.open(CrearMetodoPagoComponent, {
        width: '400px', height: '250px', data: {},
      }).afterClosed().subscribe(() => this.loadMetodosPago());
    }
  }
}
