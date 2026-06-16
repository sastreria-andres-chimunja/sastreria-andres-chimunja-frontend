import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Movimiento } from '../../shared/models/Movimiento';
import { API } from '../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class MovimientoService {
  api = `${API.BASE_URL}/${API.MOVIMIENTOS}`;

  constructor(private http: HttpClient) {}

  crear(movimiento: Movimiento) {
    return this.http.post(this.api, movimiento);
  }

  buscarMovimientoPorId(idMovimiento: number) {
    return this.http.get(`${this.api}/${idMovimiento}`);
  }
  listarMovimientos(fechaInicio?: string, fechaFin?: string, categoria?: string) {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin) params['fechaFin'] = fechaFin;
    if (categoria) params['categoria'] = categoria;
    return this.http.get(this.api, { params });
  }

  actualizar(movimiento: Movimiento) {
    const { idMovimiento } = movimiento;
    return this.http.put(`${this.api}/${idMovimiento}`, movimiento);
  }
}
