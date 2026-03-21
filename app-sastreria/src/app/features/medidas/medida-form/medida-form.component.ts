import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogRef,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Medida } from '../../../shared/models/Medida';
import { MedidaService } from '../../../core/services/medida.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImagenService } from '../../../core/services/imagen.service';
import { API } from '../../../utils/constants';

@Component({
  selector: 'app-medida-form',
  templateUrl: './medida-form.component.html',
  styleUrls: ['./medida-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
})
export class MedidaFormComponent implements OnInit {
  form: FormGroup;
  tipoPrenda = '';
  imagePreviews: string[] = [];
  selectedFiles: File[] = [];
  existingImages: { id: number; url: string }[] = [];
  isDragging = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MedidaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public medidaModel: Medida,
    private medidaService: MedidaService,
    private imagenService: ImagenService,
    private sanitizer: DomSanitizer,
  ) {
    console.log('medida', this.medidaModel);
    this.tipoPrenda = this.medidaModel.tipoPrenda || '';
    this.form = this.fb.group({
      tipoPrenda: [this.medidaModel.tipoPrenda || ''],
      // Camisa
      espalda: [this.medidaModel.espalda || 0.0],
      hombro: [this.medidaModel.hombro || 0.0],
      pecho: [this.medidaModel.pecho || 0.0],
      cintura: [this.medidaModel.cintura || 0.0],
      largoManga: [this.medidaModel.largoManga || 0.0],
      // Pantalón
      base: [this.medidaModel.base || 0.0],
      tiro: [this.medidaModel.tiro || 0.0],
      rodilla: [this.medidaModel.rodilla || 0.0],
      bota: [this.medidaModel.bota || 0.0],
      largo: [this.medidaModel.largo || 0.0],
    });
  }
  ngOnInit(): void {
    this.cargarImagenesExistentes();
  }

  seleccionarTipo(tipo: string) {
    this.tipoPrenda = tipo;
    // Limpiar campos y fotos al cambiar tipo
    this.form.reset({ tipoPrenda: tipo });
    this.imagePreviews = [];
    this.selectedFiles = [];
  }

  // ── Manejo de archivos ──────────────────────────────────
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.processFiles(Array.from(input.files));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files) this.processFiles(Array.from(files));
  }

  processFiles(files: File[]) {
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.imagePreviews.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  // ── Acciones ────────────────────────────────────────────
  cargarImagenesExistentes() {
    this.imagenService
      .getImagenes('Medida', this.medidaModel.idMedida!)
      .subscribe((resp: any) => {
        this.existingImages = resp.map((img: any) => ({
          id: img.idImagen,
          url: `${API.BASE_URL}/${img.rutaImagen.replace(/\\/g, '/')}`,
        }));
      });
  }

  // En guardar(), subir imágenes nuevas después de crear/actualizar
  guardar() {
    const payload = { ...this.medidaModel, ...this.form.value };

    const afterSave = (idMedida: number) => {
      if (this.selectedFiles.length > 0) {
        this.imagenService
          .subirImagenes(this.selectedFiles, 'Medida', idMedida)
          .subscribe(() => this.dialogRef.close(true));
      } else {
        this.dialogRef.close(true);
      }
    };

    if (this.medidaModel.idMedida) {
      this.medidaService.actualizar(payload).subscribe({
        next: () => afterSave(this.medidaModel.idMedida!),
        error: (err) => console.error('error actualizar', err),
      });
    } else {
      this.medidaService.crear(payload).subscribe({
        next: (resp: any) => afterSave(resp.medida.idMedida), // ajusta según tu backend
        error: (err) => console.error('error crear', err),
      });
    }
  }

  limpiar() {
    this.form.reset();
    this.tipoPrenda = '';
    this.imagePreviews = [];
    this.selectedFiles = [];
  }
}
