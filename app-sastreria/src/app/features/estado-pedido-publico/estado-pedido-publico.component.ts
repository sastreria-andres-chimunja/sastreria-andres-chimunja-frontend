import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PedidoService } from '../../core/services/pedido.service';

type EstadoCliente = 'pendiente' | 'asignado' | 'terminado';

interface PedidoPublico {
  idPedido: number;
  nombreCliente: string;
  nombreTipoPedido?: string;
  fechaRecibido: string;
  fechaEntrega: string;
  valorTotal: number;
  totalAbonado: number;
  estadoCliente: EstadoCliente;
  totalItems: number;
  itemsTerminados: number;
}

/**
 * Vista pública (sin login) de estado de pedido — el link va pegado en el
 * mensaje de WhatsApp que se manda al cliente. Usa el token firmado del
 * pedido (no el id plano) vía GET /pedidos/publico/:token, para que no se
 * pueda ver el estado de otro pedido adivinando números en la URL.
 *
 * Al cliente solo se le muestran 3 estados posibles: pendiente, en proceso
 * (interno "asignado") y terminado. Si el pedido ya está Entregado o
 * marcado No realizado, el backend no manda ningún detalle — solo un
 * indicador — y esta vista muestra un aviso simple sin más información.
 */
@Component({
  selector: 'app-estado-pedido-publico',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './estado-pedido-publico.component.html',
  styleUrl: './estado-pedido-publico.component.css',
})
export class EstadoPedidoPublicoComponent implements OnInit {
  cargando = true;
  noEncontrado = false;
  pedido: PedidoPublico | null = null;
  /** 'entregado' | 'no-realizado' cuando el backend bloquea el detalle. */
  avisoSimple: 'entregado' | 'no-realizado' | null = null;

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) { this.cargando = false; this.noEncontrado = true; return; }

    this.pedidoService.buscarEstadoPublico(token).subscribe({
      next: (r: any) => {
        if (r.estadoPublico === 'entregado' || r.estadoPublico === 'no-realizado') {
          this.avisoSimple = r.estadoPublico;
        } else if (r.estadoPublico === 'ok' && r.pedido) {
          this.pedido = r.pedido;
        } else {
          this.noEncontrado = true;
        }
        this.cargando = false;
      },
      error: () => {
        this.noEncontrado = true;
        this.cargando = false;
      },
    });
  }

  get saldo(): number {
    if (!this.pedido) return 0;
    return Number(this.pedido.valorTotal ?? 0) - Number(this.pedido.totalAbonado ?? 0);
  }

  get etiquetaEstado(): string {
    switch (this.pedido?.estadoCliente) {
      case 'asignado':  return 'En proceso';
      case 'terminado': return 'Terminado';
      default:            return 'Pendiente';
    }
  }

  get mensajeEstado(): string {
    switch (this.pedido?.estadoCliente) {
      case 'terminado': return '¡Tu pedido está listo! Ya lo puedes recoger en el local.';
      case 'asignado':  return 'Tu pedido está en proceso de confección/arreglo.';
      default:            return 'Tu pedido está pendiente de iniciar.';
    }
  }

  get mensajeItems(): string | null {
    if (!this.pedido || this.pedido.totalItems <= 0) return null;
    const { itemsTerminados, totalItems } = this.pedido;
    const prenda = totalItems === 1 ? 'prenda' : 'prendas';
    return `Tu pedido tiene ${itemsTerminados} ${prenda} de ${totalItems} terminadas.`;
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
