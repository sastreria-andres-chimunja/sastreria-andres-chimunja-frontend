import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class GarantiaService {
  api = `${API.BASE_URL}/${API.GARANTIAS}`;

  constructor(private http: HttpClient) {}

  crear(idEmpleado: number, nombreCliente: string, valor: number) {
    return this.http.post(this.api, { idEmpleado, nombreCliente, valor });
  }

  listar(fechaInicio?: string, fechaFin?: string, idEmpleado?: number) {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin) params['fechaFin'] = fechaFin;
    if (idEmpleado) params['idEmpleado'] = String(idEmpleado);
    return this.http.get(this.api, { params });
  }

  actualizarComision(idGarantia: number, comisionEmpleado: number) {
    return this.http.put<any>(`${this.api}/${idGarantia}/comision`, { comisionEmpleado });
  }
}
