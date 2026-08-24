export class Pedido {
  idPedido?: number;
  idCliente: number = 0;
  nombreCliente?: string = '';
  telefonoCliente?: string = '';
  fechaRecibido: string = '';
  fechaEntrega: string = '';
  valorTotal: number = 0;
  idEstado: number = 0;
  nombreEstado?: string = '';
  idTipoPedido?: number = 0;
  nombreTipoPedido?: string = '';
  totalAbonado?: number = 0;
  totalItems?: number = 0;
  itemsTerminados?: number = 0;
  tokenPublico?: string = '';
  created_at?: string = '';
  updated_at?: string = '';
  /** Nombre del empleado si TODO el pedido está asignado a uno solo; 'Varios' si está repartido; null si falta asignar. */
  empleadoAsignado?: string | null = null;
  /** Fecha/hora en que el pedido pasó a "Entregado" (se limpia si se revierte). */
  fechaEntregado?: string | null = null;
}
