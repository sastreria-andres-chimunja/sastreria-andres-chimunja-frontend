import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MetodoPago } from '../../shared/models/MetodoPago';
import { API } from '../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class MetodoPagoService {
  api = `${API.BASE_URL}/${API.METODO_PAGO}`;

  constructor(private http: HttpClient) {}

  crear(metodoPago: MetodoPago) {
    return this.http.post(this.api, metodoPago);
  }

  buscarMetodoPagoPorId(idMetodoPago: number) {
    return this.http.get(`${this.api}/${idMetodoPago}`);
  }
  listarMetodosPago() {
    return this.http.get(this.api);
  }

  actualizar(metodoPago: MetodoPago) {
    const { idMetodoPago } = metodoPago;
    return this.http.put(`${this.api}/${idMetodoPago}`, metodoPago);
  }
  eliminar(metodoPago: MetodoPago) {
    const { idMetodoPago } = metodoPago;
    return this.http.delete(`${this.api}/${idMetodoPago}`);
  }
}
