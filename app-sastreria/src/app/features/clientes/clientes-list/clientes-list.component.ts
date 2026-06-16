import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../shared/models/Cliente';
import { CrearClienteComponent } from '../crear-cliente/crear-cliente.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.css',
})
export class ClientesListComponent implements OnInit {
  clientes: Cliente[] = [];
  busqueda = '';

  constructor(private clienteService: ClienteService, public dialog: MatDialog) {}

  ngOnInit() { this.loadClientes(); }

  loadClientes() {
    this.clienteService.getAll().subscribe((resp: any) => {
      this.clientes = resp.clientes ?? [];
    });
  }

  get clientesFiltrados(): Cliente[] {
    if (!this.busqueda.trim()) return this.clientes;
    const q = this.busqueda.toLowerCase();
    return this.clientes.filter(c =>
      `${c.nombres} ${c.apellidos}`.toLowerCase().includes(q) ||
      (c.cedula ?? '').toString().includes(q) ||
      (c.telefono ?? '').toLowerCase().includes(q)
    );
  }

  initials(c: Cliente): string {
    return `${c.nombres?.[0] ?? ''}${c.apellidos?.[0] ?? ''}`.toUpperCase();
  }

  openDialog(data?: Cliente) {
    if (data?.idCliente) {
      Swal.fire({
        title: '¿Editar cliente?',
        text: `Se editará la información de ${data.nombres} ${data.apellidos}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#185FA5',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Sí, editar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed) {
          this.dialog.open(CrearClienteComponent, {
            width: '400px', height: '500px', data,
          }).afterClosed().subscribe(() => this.loadClientes());
        }
      });
    } else {
      this.dialog.open(CrearClienteComponent, {
        width: '400px', height: '500px', data: {},
      }).afterClosed().subscribe(() => this.loadClientes());
    }
  }
}
