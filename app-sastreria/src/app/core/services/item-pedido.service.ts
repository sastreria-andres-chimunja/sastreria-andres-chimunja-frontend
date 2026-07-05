import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../../utils/constants';

@Injectable({ providedIn: 'root' })
export class ItemPedidoService {
  private api = `${API.BASE_URL}/${API.ITEM_PEDIDO}`;
  constructor(private http: HttpClient) {}

  listarPorPedido(idPedido: number) {
    return this.http.get<any>(this.api, { params: { idPedido: String(idPedido) } });
  }

  listarPorEmpleado(idEmpleado: number) {
    return this.http.get<any>(this.api, { params: { idEmpleado: String(idEmpleado) } });
  }

  buscarPorId(id: number) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  crear(item: any) {
    return this.http.post<any>(this.api, item);
  }

  actualizar(id: number, item: any) {
    return this.http.put<any>(`${this.api}/${id}`, item);
  }

  eliminar(id: number) {
    return this.http.delete<any>(`${this.api}/${id}`);
  }

  pagar(id: number) {
    return this.http.put<any>(`${this.api}/${id}/pagar`, {});
  }

  getPagosItem(id: number) {
    return this.http.get<any>(`${this.api}/${id}/pagos`);
  }

  registrarPago(id: number, pago: { idMetodoPago: number | null; valor: number; observacion?: string }) {
    return this.http.post<any>(`${this.api}/${id}/registrar-pago`, pago);
  }

  actualizarEstado(id: number, idEstado: number) {
    return this.http.put<any>(`${this.api}/${id}/estado`, { idEstado });
  }

  actualizarComision(id: number, comisionEmpleado: number) {
    return this.http.put<any>(`${this.api}/${id}/comision`, { comisionEmpleado });
  }

  asignarEmpleado(id: number, idEmpleado: number) {
    return this.http.put<any>(`${this.api}/${id}/asignar`, { idEmpleado });
  }
}
