export class ItemPedido {
  idItemPedido?: number;
  idPedido: number = 0;
  idEmpleado?: number | null = null;
  idEstado?: number | null = null;
  idMedida?: number | null = null;
  valor: number = 0;
  comisionEmpleado: number = 0;
  descripcion: string = '';
  observacion?: string = '';
  fechaEntrega: string = '';
  // campos enriquecidos desde el backend
  nombreEmpleado?: string = '';
  nombreEstado?: string = '';
  tipoPrendaMedida?: string = '';
  nombreCliente?: string = '';
}
