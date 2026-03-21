import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cliente } from '../../shared/models/Cliente';
import { API } from '../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  api = `${API.BASE_URL}/${API.CLIENTES}`;

  constructor(private http: HttpClient) {}

  crear(cliente: Cliente) {
    return this.http.post(this.api, cliente);
  }

  buscar(cedula: string) {
    return this.http.get(`${this.api}/search?cedula=${cedula}`);
  }
  buscarPorId(idCliente: number) {
    return this.http.get(`${this.api}/${idCliente}`);
  }
  getAll() {
    return this.http.get(this.api);
  }
  actualizar(cliente: Cliente) {
    const { idCliente } = cliente;
    return this.http.put(`${this.api}/${idCliente}`, cliente);
  }
}
