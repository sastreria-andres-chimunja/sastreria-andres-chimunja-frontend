import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Nomina } from '../../shared/models/Nomina';
import { API } from '../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class NominaService {
  api = `${API.BASE_URL}/${API.NOMINA}`;

  constructor(private http: HttpClient) {}

  nominaGeneral(fechaInicio?: string, fechaFin?: string) {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin) params['fechaFin'] = fechaFin;
    return this.http.get(this.api, { params });
  }

  nominaEmpleado(idEmpleado: number, fechaInicio?: string, fechaFin?: string, historial?: boolean) {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin) params['fechaFin'] = fechaFin;
    if (historial) params['historial'] = 'true';
    return this.http.get(`${this.api}/${idEmpleado}`, { params });
  }

  liquidar(idEmpleado: number) {
    return this.http.post(`${this.api}/${idEmpleado}/liquidar`, {});
  }

  /** Ítems marcados Terminado en el rango, agrupables por día en el frontend. */
  facturadoDiario(idEmpleado: number, fechaInicio?: string, fechaFin?: string) {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin) params['fechaFin'] = fechaFin;
    return this.http.get(`${this.api}/${idEmpleado}/facturado`, { params });
  }
}
