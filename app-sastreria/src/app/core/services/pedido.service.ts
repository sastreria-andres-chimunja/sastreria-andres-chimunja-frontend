import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../../utils/constants';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private api = `${API.BASE_URL}/${API.PEDIDOS}`;
  constructor(private http: HttpClient) {}

  listar(fechaInicio?: string, fechaFin?: string, idEmpleado?: number) {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin) params['fechaFin'] = fechaFin;
    if (idEmpleado) params['idEmpleado'] = String(idEmpleado);
    return this.http.get<any>(this.api, { params });
  }

  buscarPorId(id: number) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  crear(pedido: any) {
    return this.http.post<any>(this.api, pedido);
  }

  actualizar(id: number, pedido: any) {
    return this.http.put<any>(`${this.api}/${id}`, pedido);
  }

  eliminar(id: number) {
    return this.http.delete<any>(`${this.api}/${id}`);
  }

  getAbonosPedido(id: number) {
    return this.http.get<any>(`${this.api}/${id}/abonos`);
  }

  registrarAbono(id: number, abono: { idMetodoPago: number | null; valor: number; observacion?: string }) {
    return this.http.post<any>(`${this.api}/${id}/registrar-abono`, abono);
  }
}
