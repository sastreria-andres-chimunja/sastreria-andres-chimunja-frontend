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
  created_at?: string = '';
  updated_at?: string = '';
}
