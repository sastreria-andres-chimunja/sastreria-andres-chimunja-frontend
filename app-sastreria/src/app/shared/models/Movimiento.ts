export class Movimiento {
  idMovimiento?: number = 0;
  idTipoMovimiento: number = 0;
  idCategoriaMovimiento: number = 0;
  idMetodoPago?: number;
  idReferencia?: number;
  valor: number = 0;
  tipoReferencia?: string;
  fecha: string = '';
  observacion: string = '';
  // Campos enriquecidos del JOIN (del backend)
  nombreTipoMovimiento?: string;
  nombreCategoriaMovimiento?: string;
  nombreMetodoPago?: string;
}
