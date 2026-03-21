import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API } from '../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class ImagenService {
  api = `${API.BASE_URL}/${API.IMAGENES}`;
  files: File[] = [];

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.files = Array.from(event.target.files);
  }

  subirImagenes(files: File[], tipoReferencia: string, idReferencia: number) {
    const formData = new FormData();

    formData.append('tipoReferencia', tipoReferencia);
    formData.append('idReferencia', idReferencia.toString());

    files.forEach((file) => {
      formData.append('imagenes', file);
    });

    return this.http.post(`${this.api}/upload`, formData);
  }
  getImagenes(tipoReferencia: string, idReferencia: number) {
    const params = new HttpParams()
      .set('tipoReferencia', tipoReferencia)
      .set('idReferencia', idReferencia.toString());

    return this.http.get(`${this.api}`, { params });
  }
  getImagenById(id: number) {
    return this.http.get(`${this.api}/${id}`);
  }
}
