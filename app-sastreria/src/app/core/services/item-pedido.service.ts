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
}
