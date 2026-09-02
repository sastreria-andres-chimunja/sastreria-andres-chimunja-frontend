import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
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
import { MatSelectModule } from '@angular/material/select';
import { Cliente } from '../../../shared/models/Cliente';
import { PAISES_INDICATIVO, parsearTelefonoGuardado } from '../../../utils/paises-indicativo';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-cliente',
  templateUrl: './crear-cliente.component.html',
  styleUrls: ['./crear-cliente.component.css'],
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
})
export class CrearClienteComponent implements OnInit {
  form!: FormGroup;
  cliente = new Cliente();
  isLoading = false;
  titulo = '';
  icono = '';
  paises = PAISES_INDICATIVO;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private dialogRef: MatDialogRef<CrearClienteComponent>,
    @Inject(MAT_DIALOG_DATA) public clienteModel: Cliente,
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.titulo = this.clienteModel.idCliente! > 0 ? 'Editar' : 'Agregar';
    this.icono = this.clienteModel.idCliente! > 0 ? 'create' : 'person_add';
    console.log('id2', this.clienteModel.idCliente);
  }

  createForm() {
    const { indicativo, local } = parsearTelefonoGuardado(this.clienteModel.telefono);
    this.form = this.fb.group({
      nombres: [this.clienteModel.nombres, [Validators.required]],
      apellidos: [this.clienteModel.apellidos, [Validators.required]],
      cedula: [this.clienteModel.cedula],
      indicativo: [indicativo, [Validators.required]],
      telefono: [local, [Validators.required]],
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Mapear valores del form al modelo -- el teléfono se guarda concatenado
    // con el indicativo en el mismo campo (p. ej. "573001234567"), para
    // poder mandarle WhatsApp a números extranjeros sin un campo aparte.
    const { indicativo, telefono, ...resto } = this.form.value;
    Object.assign(this.clienteModel, resto);
    this.clienteModel.telefono = `${indicativo}${(telefono ?? '').replace(/\D/g, '')}`;

    this.isLoading = true;
    console.log('id1', this.clienteModel.idCliente);

    if (this.clienteModel.idCliente! > 0) {
      console.log('id3', this.clienteModel.idCliente);

      this.clienteService.actualizar(this.clienteModel).subscribe({
        next: () => {
          this.isLoading = false;
          Swal.fire({ title: '¡Cliente editado!', icon: 'success', timer: 1800, showConfirmButton: false })
            .then(() => this.dialogRef.close(true));
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar cliente:', err);
          Swal.fire({
            title: 'No se pudo guardar',
            text: err?.error?.error || 'Ocurrió un error inesperado.',
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        },
      });
    } else {
      this.clienteService.crear(this.clienteModel).subscribe({
        next: () => {
          this.isLoading = false;
          Swal.fire({ title: '¡Cliente creado!', icon: 'success', timer: 1800, showConfirmButton: false })
            .then(() => this.dialogRef.close(true));
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar cliente:', err);
          Swal.fire({
            title: 'No se pudo crear',
            text: err?.error?.error || 'Ocurrió un error inesperado.',
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        },
      });
    }
  }
}
