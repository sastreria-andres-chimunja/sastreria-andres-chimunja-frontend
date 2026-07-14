import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../../utils/constants';

@Injectable({ providedIn: 'root' })
export class LimiteDiarioService {
  private api = `${API.BASE_URL}/${API.LIMITE_DIARIO}`;
  constructor(private http: HttpClient) {}

  obtener() {
    return this.http.get<any>(this.api);
  }

  actualizar(monto: number) {
    return this.http.put<any>(this.api, { monto });
  }
}
