import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ImagenService {
  api = 'http://localhost:3000/imagenes';
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
}
