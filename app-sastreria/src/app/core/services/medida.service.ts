import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Medida } from '../../shared/models/Medida';
import { API } from '../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class MedidaService {
  api = `${API.BASE_URL}/${API.MEDIDAS}`;

  constructor(private http: HttpClient) {}

  crear(Medida: Medida) {
    return this.http.post(this.api, Medida);
  }

  buscarMedidaPorId(idMedida: number) {
    return this.http.get(`${this.api}/${idMedida}`);
  }
  listarMedidasPorCliente(idCliente: number) {
    return this.http.get(`${this.api}/byCustomer/${idCliente}`);
  }

  actualizar(Medida: Medida) {
    const { idMedida } = Medida;
    return this.http.put(`${this.api}/${idMedida}`, Medida);
  }
}
