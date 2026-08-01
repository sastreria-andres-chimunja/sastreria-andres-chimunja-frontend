import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PedidoService } from '../../core/services/pedido.service';
import { Pedido } from '../../shared/models/Pedido';

/**
 * Vista pública (sin login) de estado de pedido — el link va pegado en el
 * mensaje de WhatsApp que se manda al cliente. Reutiliza GET /pedidos/:id
 * (ya sin autenticación, igual que el resto de la API — ver hallazgo de
 * seguridad conocido en el backend) en vez de crear un endpoint nuevo.
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
  pedido: Pedido | null = null;

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.cargando = false; this.noEncontrado = true; return; }

    this.pedidoService.buscarPorId(id).subscribe({
      next: (r: any) => {
        this.pedido = r.pedido ?? null;
        this.noEncontrado = !this.pedido;
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

  get estadoClase(): string {
    const nombre = (this.pedido?.nombreEstado ?? '').toLowerCase();
    if (nombre.includes('entrega')) return 'entregado';
    if (nombre.includes('cancel')) return 'cancelado';
    if (nombre === 'no realizado') return 'no-realizado';
    if (nombre.includes('terminad')) return 'terminado';
    if (nombre.includes('asignad')) return 'asignado';
    return 'pendiente';
  }

  get mensajeEstado(): string {
    switch (this.estadoClase) {
      case 'entregado':     return 'Este pedido ya fue entregado. ¡Gracias por confiar en nosotros!';
      case 'terminado':     return '¡Tu pedido está listo! Ya lo puedes recoger en el local.';
      case 'asignado':      return 'Tu pedido está en proceso de confección/arreglo.';
      case 'no-realizado':  return 'Este pedido fue marcado como no realizado.';
      case 'cancelado':     return 'Este pedido fue cancelado.';
      default:               return 'Tu pedido está pendiente de iniciar.';
    }
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
