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

  /**
   * Resumen de un empleado por período, filtrado por la fecha en que cada
   * ítem pasó a Terminado (no fecha de entrega ni de pago) -- Facturado,
   * Pendiente de pago, Abonos y Saldo quedan todos atados al mismo rango.
   */
  resumenPeriodo(idEmpleado: number, fechaInicio?: string, fechaFin?: string) {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin) params['fechaFin'] = fechaFin;
    return this.http.get(`${this.api}/${idEmpleado}/periodo`, { params });
  }
}
