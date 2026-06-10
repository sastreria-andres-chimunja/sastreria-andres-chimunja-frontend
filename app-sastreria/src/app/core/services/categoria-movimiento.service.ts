import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CategoriaMovimiento } from '../../shared/models/CategoriaMovimiento';
import { API } from '../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class CategoriaMovimientoService {
  api = `${API.BASE_URL}/${API.CATEGORIA_MOVIMIENTO}`;

  constructor(private http: HttpClient) {}

  crear(categoriaMovimiento: CategoriaMovimiento) {
    return this.http.post(this.api, categoriaMovimiento);
  }

  buscarCategoriaMovimientoPorId(idCategoriaMovimiento: number) {
    return this.http.get(`${this.api}/${idCategoriaMovimiento}`);
  }
  listarCategoriasMovimiento() {
    return this.http.get(this.api);
  }

  actualizar(categoriaMovimiento: CategoriaMovimiento) {
    const { idCategoriaMovimiento } = categoriaMovimiento;
    return this.http.put(
      `${this.api}/${idCategoriaMovimiento}`,
      categoriaMovimiento,
    );
  }
  eliminar(categoriaMovimiento: CategoriaMovimiento) {
    const { idCategoriaMovimiento } = categoriaMovimiento;
    return this.http.delete(`${this.api}/${idCategoriaMovimiento}`);
  }
}
