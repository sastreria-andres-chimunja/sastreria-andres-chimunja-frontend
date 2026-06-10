import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogRef,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoriaMovimientoService } from '../../../core/services/categoria-movimiento.service';
import { MatSelectModule } from '@angular/material/select';
import { CategoriaMovimiento } from '../../../shared/models/CategoriaMovimiento';

@Component({
  selector: 'app-crear-categoria-movimiento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './crear-categoria-movimiento.component.html',
  styleUrl: './crear-categoria-movimiento.component.css',
})
export class CrearCategoriaMovimientoComponent implements OnInit {
  form!: FormGroup;
  categoriaMovimiento = new CategoriaMovimiento();
  isLoading = false;
  titulo = '';
  icono = '';

  constructor(
    private fb: FormBuilder,
    private categoriaMovimientoService: CategoriaMovimientoService,
    private dialogRef: MatDialogRef<CategoriaMovimiento>,
    @Inject(MAT_DIALOG_DATA) public categoriaModel: CategoriaMovimiento,
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.titulo =
      this.categoriaModel.idCategoriaMovimiento! > 0 ? 'Editar' : 'Agregar';
    this.icono =
      this.categoriaModel.idCategoriaMovimiento! > 0 ? 'create' : 'person_add';
  }

  createForm() {
    this.form = this.fb.group({
      nombreCategoriaMovimiento: [
        this.categoriaModel.nombreCategoriaMovimiento,
        [Validators.required],
      ],
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Mapear valores del form al modelo
    Object.assign(this.categoriaModel, this.form.value);

    this.isLoading = true;
    console.log('id1', this.categoriaModel.idCategoriaMovimiento);

    if (this.categoriaModel.idCategoriaMovimiento! > 0) {
      console.log('id3', this.categoriaModel.idCategoriaMovimiento);

      this.categoriaMovimientoService
        .actualizar(this.categoriaModel)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.dialogRef.close(true); // cierra y notifica éxito al padre
          },
          error: (err) => {
            this.isLoading = false;
            // Aquí puedes mostrar un snackbar o alerta con err.error.message
            console.error('Error al guardar categoría de movimiento:', err);
          },
        });
    } else {
      this.categoriaMovimientoService.crear(this.categoriaModel).subscribe({
        next: () => {
          this.isLoading = false;
          this.dialogRef.close(true); // cierra y notifica éxito al padre
        },
        error: (err) => {
          this.isLoading = false;
          // Aquí puedes mostrar un snackbar o alerta con err.error.message
          console.error('Error al guardar categoría de movimiento:', err);
        },
      });
    }
  }
}
