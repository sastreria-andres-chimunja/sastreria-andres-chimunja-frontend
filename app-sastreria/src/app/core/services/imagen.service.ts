import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../../utils/constants';

@Injectable({ providedIn: 'root' })
export class ImagenService {
  private api = `${API.BASE_URL}/${API.IMAGENES}`;
  constructor(private http: HttpClient) {}

  listarPorReferencia(tipoReferencia: string, idReferencia: number) {
    return this.http.get<any[]>(this.api, {
      params: { tipoReferencia, idReferencia: String(idReferencia) },
    });
  }

  subir(tipoReferencia: string, idReferencia: number, files: File[]) {
    const form = new FormData();
    form.append('tipoReferencia', tipoReferencia);
    form.append('idReferencia', String(idReferencia));
    files.forEach((f) => form.append('imagenes', f));
    return this.http.post<any[]>(`${this.api}/upload`, form);
  }

  eliminar(idImagen: number) {
    return this.http.delete<any>(`${this.api}/${idImagen}`);
  }

  getUrl(rutaImagen: string): string {
    // rutaImagen viene de file.path (multer) -- en Windows (solo en
    // desarrollo local) usa backslashes, que no sirven en una URL.
    return `${API.BASE_URL}/${rutaImagen.replace(/\\/g, '/')}`;
  }
}
