import { Component } from '@angular/core';
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
export class MedidaFormComponent {
  form: FormGroup;
  tipoPrenda = '';
  imagePreviews: string[] = [];
  selectedFiles: File[] = [];
  isDragging = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MedidaFormComponent>,
  ) {
    this.form = this.fb.group({
      tipoPrenda: [''],
      // Camisa
      espalda: [null],
      hombro: [null],
      pecho: [null],
      cintura: [null],
      largoManga: [null],
      // Pantalón
      base: [null],
      tiro: [null],
      rodilla: [null],
      bota: [null],
      largo: [null],
    });
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
  guardar() {
    console.log('Medidas:', this.form.value);
    console.log('Fotos:', this.selectedFiles);
    // Aquí conectas con tu servicio
  }

  limpiar() {
    this.form.reset();
    this.tipoPrenda = '';
    this.imagePreviews = [];
    this.selectedFiles = [];
  }
}
