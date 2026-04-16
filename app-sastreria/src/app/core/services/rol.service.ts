import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Rol } from '../../shared/models/Rol';
import { API } from '../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class RolService {
  api = `${API.BASE_URL}/${API.ROL}`;

  constructor(private http: HttpClient) {}

  crear(rol: Rol) {
    return this.http.post(this.api, rol);
  }

  buscarRolPorId(idRol: number) {
    return this.http.get(`${this.api}/${idRol}`);
  }
  listarRoles() {
    return this.http.get(this.api);
  }

  actualizar(rol: Rol) {
    const { idRol } = rol;
    return this.http.put(`${this.api}/${idRol}`, rol);
  }

  eliminar(rol: Rol) {
    const { idRol } = rol;
    return this.http.delete(`${this.api}/${idRol}`);
  }
}
