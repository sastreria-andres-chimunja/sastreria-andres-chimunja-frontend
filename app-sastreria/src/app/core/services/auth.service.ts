import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API } from '../../utils/constants';
import { Empleado } from '../../shared/models/Empleado';

interface LoginResponse {
  token: string;
  empleado: Empleado & { nombreRol?: string };
  debeCambiarClave: boolean;
}

export interface SesionUsuario {
  token: string;
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  idRol: number;
  nombreRol: string;
  debeCambiarClave: boolean;
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
        map(({ token, empleado, debeCambiarClave }) => ({
          token,
          idEmpleado: empleado.idEmpleado!,
          nombres: empleado.nombres,
          apellidos: empleado.apellidos,
          idRol: empleado.idRol,
          nombreRol: empleado.nombreRol ?? '',
          debeCambiarClave: debeCambiarClave ?? false,
        })),
        tap((sesion) => localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion)))
      );
  }

  cambiarClaveInicial(idEmpleado: number, claveNueva: string): Observable<any> {
    return this.http
      .put(`${this.authApi}/cambiar-clave-inicial`, { idEmpleado, claveNueva })
      .pipe(
        tap(() => {
          const sesion = this.getSesion();
          if (sesion) {
            sesion.debeCambiarClave = false;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
          }
        })
      );
  }

  cambiarClave(idEmpleado: number, claveActual: string, claveNueva: string): Observable<any> {
    return this.http.put(`${this.authApi}/cambiar-clave`, { idEmpleado, claveActual, claveNueva });
  }

  recuperarClave(username: string): Observable<{ claveTemp: string; telefono: string; nombre: string }> {
    return this.http.post<{ claveTemp: string; telefono: string; nombre: string }>(`${this.authApi}/recuperar`, { username });
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

  getIdEmpleado(): number | null {
    return this.getSesion()?.idEmpleado ?? null;
  }

  getNombreRol(): string {
    return this.getSesion()?.nombreRol ?? '';
  }

  mustChangePassword(): boolean {
    return this.getSesion()?.debeCambiarClave ?? false;
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  esAdmin(): boolean {
    return this.getNombreRol().toLowerCase() === 'admin';
  }

  esAsistente(): boolean {
    return this.getNombreRol().toLowerCase() === 'asistente';
  }

  esOperario(): boolean {
    return this.getNombreRol().toLowerCase() === 'operario';
  }
}
