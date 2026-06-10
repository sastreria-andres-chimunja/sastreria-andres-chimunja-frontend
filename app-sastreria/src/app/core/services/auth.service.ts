import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API } from '../../utils/constants';
import { Empleado } from '../../shared/models/Empleado';

interface LoginResponse {
  token: string;
  empleado: Empleado;
}

export interface SesionUsuario {
  token: string;
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  idRol: number;
}

const STORAGE_KEY = 'sesion_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = `${API.BASE_URL}/${API.AUTH}`;

  constructor(private http: HttpClient) {}

  login(username: string, clave: string): Observable<SesionUsuario> {
    return this.http
      .post<LoginResponse>(`${this.authApi}/login`, { username, clave })
      .pipe(
        map(({ token, empleado }) => ({
          token,
          idEmpleado: empleado.idEmpleado!,
          nombres: empleado.nombres,
          apellidos: empleado.apellidos,
          idRol: empleado.idRol,
        })),
        tap((sesion) => localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion)))
      );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  getSesion(): SesionUsuario | null {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as SesionUsuario) : null;
  }

  getToken(): string | null {
    return this.getSesion()?.token ?? null;
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}
