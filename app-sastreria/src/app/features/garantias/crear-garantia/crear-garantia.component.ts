import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { GarantiaService } from '../../../core/services/garantia.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../shared/models/Cliente';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-garantia',
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
  ],
  templateUrl: './crear-garantia.component.html',
  styleUrl: './crear-garantia.component.css',
})
export class CrearGarantiaComponent implements OnDestroy {
  form: FormGroup;
  isLoading = false;

  // Autocompletar cliente mientras escribe -- mismo patrón que crear-pedido
  // (búsqueda con debounce contra /clientes/search). No es un FK real (la
  // garantía solo guarda el nombre como texto, ver garantia.repository.js),
  // así que elegir una sugerencia solo rellena el texto -- también se puede
  // escribir un nombre que no exista como cliente registrado.
  clientesSugeridos: Cliente[] = [];
  mostrarSugerencias = false;
  private busquedaCliente$ = new Subject<string>();
  private busquedaSub: Subscription;

  constructor(
    private fb: FormBuilder,
    private garantiaService: GarantiaService,
    private authService: AuthService,
    private clienteService: ClienteService,
    private dialogRef: MatDialogRef<CrearGarantiaComponent>,
  ) {
    this.form = this.fb.group({
      nombreCliente: ['', [Validators.required]],
      valor: [null, [Validators.required, Validators.min(1)]],
    });

    this.busquedaSub = this.busquedaCliente$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q) => {
        if (q.trim().length < 2) { this.clientesSugeridos = []; return; }
        this.clienteService.buscar(q).subscribe((r: any) => {
          this.clientesSugeridos = r.clientes ?? [];
          this.mostrarSugerencias = true;
        });
      });
  }

  ngOnDestroy(): void {
    this.busquedaSub.unsubscribe();
  }

  onClienteInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.form.get('nombreCliente')!.setValue(valor);
    this.busquedaCliente$.next(valor);
  }

  seleccionarCliente(c: Cliente): void {
    this.form.get('nombreCliente')!.setValue(`${c.nombres} ${c.apellidos}`);
    this.mostrarSugerencias = false;
    this.clientesSugeridos = [];
  }

  getInitials(nombre: string): string {
    return (nombre || '').charAt(0).toUpperCase();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const idEmpleado = this.authService.getIdEmpleado();
    if (!idEmpleado) return;

    const { nombreCliente, valor } = this.form.value;
    this.isLoading = true;
    this.garantiaService.crear(idEmpleado, nombreCliente, valor).subscribe({
      next: () => {
        this.isLoading = false;
        Swal.fire({ title: '¡Garantía registrada!', icon: 'success', timer: 1800, showConfirmButton: false })
          .then(() => this.dialogRef.close(true));
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire({
          title: 'No se pudo registrar',
          text: err?.error?.error || 'Ocurrió un error inesperado.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
