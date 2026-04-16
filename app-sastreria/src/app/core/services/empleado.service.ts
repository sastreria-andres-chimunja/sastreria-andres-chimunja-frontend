import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Empleado } from '../../shared/models/Empleado';
import { API } from '../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class EmpleadoService {
  api = `${API.BASE_URL}/${API.EMPLEADOS}`;

  constructor(private http: HttpClient) {}

  crear(empleado: Empleado) {
    return this.http.post(this.api, empleado);
  }

  //   buscar(cedula: string) {
  //     return this.http.get(`${this.api}/search?cedula=${cedula}`);
  //   }
  buscarPorId(idEmpleado: number) {
    return this.http.get(`${this.api}/${idEmpleado}`);
  }
  getAll() {
    return this.http.get(this.api);
  }
  actualizar(Empleado: Empleado) {
    const { idEmpleado } = Empleado;
    return this.http.put(`${this.api}/${idEmpleado}`, Empleado);
  }
}
