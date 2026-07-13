import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../../utils/constants';

@Injectable({ providedIn: 'root' })
export class TipoPedidoService {
  private api = `${API.BASE_URL}/${API.TIPO_PEDIDO}`;
  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<any>(this.api);
  }
}
