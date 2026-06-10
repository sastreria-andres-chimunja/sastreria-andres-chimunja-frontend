import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../../utils/constants';
import { TipoMovimiento } from '../../shared/models/TipoMovimiento';

@Injectable({
  providedIn: 'root',
})
export class TipoMovimientoService {
  api = `${API.BASE_URL}/${API.TIPO_MOVIMIENTO}`;

  constructor(private http: HttpClient) {}

  crear(tipoMovimiento: TipoMovimiento) {
    return this.http.post(this.api, tipoMovimiento);
  }

  buscarTipoMovimientoPorId(idTipoMovimiento: number) {
    return this.http.get(`${this.api}/${idTipoMovimiento}`);
  }
  listarTiposMovimiento() {
    return this.http.get(this.api);
  }

  actualizar(tipoMovimiento: TipoMovimiento) {
    const { idTipoMovimiento } = tipoMovimiento;
    return this.http.put(`${this.api}/${idTipoMovimiento}`, tipoMovimiento);
  }
  eliminar(tipoMovimiento: TipoMovimiento) {
    const { idTipoMovimiento } = tipoMovimiento;
    return this.http.delete(`${this.api}/${idTipoMovimiento}`);
  }
}
