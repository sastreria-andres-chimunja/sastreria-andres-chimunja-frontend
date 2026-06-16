import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { AuthService } from '../../../core/services/auth.service';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Empleado } from '../../../shared/models/Empleado';
import { Rol } from '../../../shared/models/Rol';
import { RolService } from '../../../core/services/rol.service';
import { MatSelectModule } from '@angular/material/select';
import { dateToString, stringToDate } from '../../../utils/date.utils';
import Swal from 'sweetalert2';

interface CrearEmpleadoResponse {
  empleado: Empleado;
  clave: string;
}

@Component({
  selector: 'app-crear-empleado',
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
    MatDatepickerModule,
    MatSelectModule,
  ],
  templateUrl: './crear-empleado.component.html',
  styleUrl: './crear-empleado.component.css',
})
export class CrearEmpleadoComponent implements OnInit {
  form!: FormGroup;
  empleado = new Empleado();
  isLoading = false;
  titulo = '';
  icono = '';
  roles: Rol[] = [];

  // Estado post-creación
  empleadoCreado: Empleado | null = null;
  claveGenerada = '';
  telefonoAdmin = '';

  constructor(
    private fb: FormBuilder,
    private empleadoService: EmpleadoService,
    private authService: AuthService,
    private rolService: RolService,
    private dialogRef: MatDialogRef<CrearEmpleadoComponent>,
    @Inject(MAT_DIALOG_DATA) public empleadoModel: Empleado,
  ) {}

  ngOnInit(): void {
    this.listarRoles();
    this.createForm();
    this.titulo = this.empleadoModel.idEmpleado! > 0 ? 'Editar' : 'Agregar';
    this.icono = this.empleadoModel.idEmpleado! > 0 ? 'create' : 'person_add';

    // Obtener teléfono del admin actual para el botón WhatsApp
    const idAdmin = this.authService.getIdEmpleado();
    if (idAdmin) {
      this.empleadoService.buscarPorId(idAdmin).subscribe({
        next: (resp: any) => {
          this.telefonoAdmin = resp?.empleado?.telefono ?? resp?.telefono ?? '';
        },
      });
    }
  }

  createForm() {
    this.form = this.fb.group({
      nombres: [this.empleadoModel.nombres, [Validators.required]],
      apellidos: [this.empleadoModel.apellidos, [Validators.required]],
      fechaCumpleanios: [
        stringToDate(this.empleadoModel.fechaCumpleanios) ?? new Date(),
        [Validators.required],
      ],
      telefono: [this.empleadoModel.telefono, [Validators.required]],
      direccion: [this.empleadoModel.direccion, [Validators.required]],
      idRol: [this.empleadoModel.idRol, [Validators.required]],
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = { ...this.form.value };
    formValue.fechaCumpleanios = dateToString(formValue.fechaCumpleanios);
    Object.assign(this.empleadoModel, formValue);

    this.isLoading = true;

    if (this.empleadoModel.idEmpleado! > 0) {
      this.empleadoService.actualizar(this.empleadoModel).subscribe({
        next: () => {
          this.isLoading = false;
          Swal.fire({ title: '¡Empleado editado!', icon: 'success', timer: 1800, showConfirmButton: false })
            .then(() => this.dialogRef.close(true));
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar empleado:', err);
        },
      });
    } else {
      this.empleadoService.crear(this.empleadoModel).subscribe({
        next: (resp: any) => {
          this.isLoading = false;
          const r = resp as CrearEmpleadoResponse;
          this.empleadoCreado = r.empleado;
          this.claveGenerada = r.clave;
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar empleado:', err);
        },
      });
    }
  }

  get nombreCompleto(): string {
    return `${this.empleadoCreado?.nombres ?? ''} ${this.empleadoCreado?.apellidos ?? ''}`.trim();
  }

  get telefonoEmpleado(): string {
    return this.form.get('telefono')?.value ?? '';
  }

  get usernameEmpleado(): string {
    const normalizar = (s: string) =>
      s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    const nombres = this.form.get('nombres')?.value ?? '';
    const apellidos = this.form.get('apellidos')?.value ?? '';
    const pn = normalizar(nombres.trim().split(/\s+/)[0]);
    const pa = normalizar(apellidos.trim().split(/\s+/)[0]);
    return `${pn}${pa}`;
  }

  private mensajeWhatsApp(destino: 'empleado' | 'admin'): string {
    const nombre = this.nombreCompleto;
    const msg = destino === 'empleado'
      ? `Hola ${nombre}! 👋 Aquí están tus credenciales de acceso al sistema de Sastrería Andrés Chimunja:\n\n` +
        `🔑 *Usuario:* ${this.usernameEmpleado}\n` +
        `🔐 *Contraseña temporal:* ${this.claveGenerada}\n\n` +
        `⚠️ Al ingresar por primera vez, el sistema te pedirá que cambies tu contraseña.\n\n` +
        `Ingresa en: ${window.location.origin}`
      : `📋 *Nuevo empleado registrado*\n\n` +
        `👤 Nombre: ${nombre}\n` +
        `📱 Teléfono: ${this.telefonoEmpleado}\n` +
        `🔑 Usuario: ${this.usernameEmpleado}\n` +
        `🔐 Contraseña temp: ${this.claveGenerada}`;
    return encodeURIComponent(msg);
  }

  enviarWhatsAppEmpleado(): void {
    const tel = this.telefonoEmpleado.replace(/\D/g, '');
    if (!tel) return;
    window.open(`https://wa.me/57${tel}?text=${this.mensajeWhatsApp('empleado')}`, '_blank');
  }

  enviarWhatsAppAdmin(): void {
    const tel = this.telefonoAdmin.replace(/\D/g, '');
    if (!tel) return;
    window.open(`https://wa.me/57${tel}?text=${this.mensajeWhatsApp('admin')}`, '_blank');
  }

  cerrar(): void {
    this.dialogRef.close(this.empleadoCreado != null);
  }

  listarRoles() {
    this.rolService.listarRoles().subscribe((resp: any) => {
      this.roles = resp.roles;
    });
  }
}
