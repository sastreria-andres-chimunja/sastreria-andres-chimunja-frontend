import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Nomina } from '../../shared/models/nomina';
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

  nominaEmpleado(idEmpleado: number, fechaInicio?: string, fechaFin?: string) {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin) params['fechaFin'] = fechaFin;
    return this.http.get(`${this.api}/${idEmpleado}`, { params });
  }
}
