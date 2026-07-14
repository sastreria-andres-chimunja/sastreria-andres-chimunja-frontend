import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';

import { LimiteDiarioService } from '../../core/services/limite-diario.service';

@Component({
  selector: 'app-limite-diario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './limite-diario.component.html',
  styleUrl: './limite-diario.component.css',
})
export class LimiteDiarioComponent implements OnInit {
  form!: FormGroup;
  cargando = false;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private limiteDiarioService: LimiteDiarioService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      monto: [null, [Validators.required, Validators.min(0)]],
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.limiteDiarioService.obtener().subscribe({
      next: (r: any) => {
        this.form.patchValue({ monto: Number(r.limiteDiario?.monto ?? 0) });
        this.cargando = false;
      },
      error: () => { this.cargando = false; },
    });
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    this.limiteDiarioService.actualizar(this.form.value.monto).subscribe({
      next: () => {
        this.guardando = false;
        Swal.fire({
          title: '¡Guardado!',
          text: 'El límite diario de entregas se actualizó correctamente.',
          icon: 'success',
          confirmButtonColor: '#2563eb',
        });
      },
      error: () => {
        this.guardando = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudo guardar el límite diario. Intenta de nuevo.',
          icon: 'error',
          confirmButtonColor: '#2563eb',
        });
      },
    });
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
