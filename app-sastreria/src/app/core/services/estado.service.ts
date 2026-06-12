import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../../utils/constants';

@Injectable({ providedIn: 'root' })
export class EstadoService {
  private api = `${API.BASE_URL}/${API.ESTADO}`;
  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<any>(this.api);
  }
}
