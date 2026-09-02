import { Injectable } from '@angular/core';

/**
 * Guarda el rango de fecha elegido en el filtro de "Hoja de trabajo" para
 * que sobreviva a navegar a un pedido y volver (Angular destruye y
 * recrea PedidosListComponent en cada navegación, así que su propio
 * FormControl no alcanza). Vive mientras dure la sesión de la pestaña --
 * se limpia solo cuando el usuario aprieta "Limpiar" en el filtro, no por
 * tiempo ni al recargar.
 */
@Injectable({ providedIn: 'root' })
export class FiltroFechaPedidosService {
  desde: Date | null = null;
  hasta: Date | null = null;
  activo = false;

  guardar(desde: Date | null, hasta: Date | null): void {
    this.desde = desde;
    this.hasta = hasta;
    this.activo = !!(desde || hasta);
  }

  limpiar(): void {
    this.desde = null;
    this.hasta = null;
    this.activo = false;
  }
}
