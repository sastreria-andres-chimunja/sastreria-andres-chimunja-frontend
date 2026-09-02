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
import { telefonoConIndicativo } from '../../../utils/telefono.utils';
import { PAISES_INDICATIVO, parsearTelefonoGuardado } from '../../../utils/paises-indicativo';
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
  paises = PAISES_INDICATIVO;

  // Estado post-creación
  empleadoCreado: Empleado | null = null;
  claveGenerada  = '';
  telefonoAdmin  = '';

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
    const { indicativo, local } = parsearTelefonoGuardado(this.empleadoModel.telefono);
    this.form = this.fb.group({
      nombres: [this.empleadoModel.nombres, [Validators.required]],
      apellidos: [this.empleadoModel.apellidos, [Validators.required]],
      fechaCumpleanios: [
        stringToDate(this.empleadoModel.fechaCumpleanios) ?? new Date(),
        [Validators.required],
      ],
      indicativo: [indicativo, [Validators.required]],
      telefono: [local, [Validators.required]],
      direccion: [this.empleadoModel.direccion, [Validators.required]],
      idRol: [this.empleadoModel.idRol, [Validators.required]],
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // El teléfono se guarda concatenado con el indicativo en el mismo
    // campo (p. ej. "573001234567"), para poder mandarle credenciales por
    // WhatsApp a empleados con número extranjero.
    const { indicativo, telefono, ...resto } = this.form.value;
    const formValue: any = { ...resto };
    formValue.fechaCumpleanios = dateToString(formValue.fechaCumpleanios);
    formValue.telefono = `${indicativo}${(telefono ?? '').replace(/\D/g, '')}`;
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
          Swal.fire({
            title: 'No se pudo guardar',
            text: err?.error?.error || 'Ocurrió un error inesperado.',
            icon: 'error',
            confirmButtonColor: '#d33',
          });
        },
      });
    } else {
      this.empleadoService.crear(this.empleadoModel).subscribe({
        next: (resp: any) => {
          this.isLoading = false;
          const r = resp as CrearEmpleadoResponse;
          this.empleadoCreado = r.empleado;
          this.claveGenerada  = r.clave;
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar empleado:', err);
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

  get nombreCompleto(): string {
    return `${this.empleadoCreado?.nombres ?? ''} ${this.empleadoCreado?.apellidos ?? ''}`.trim();
  }

  /**
   * Número completo CON el indicativo elegido en el form -- a diferencia de
   * telefonoConIndicativo() (que adivina el indicativo por longitud para
   * números YA guardados), acá el indicativo se sabe con certeza porque es
   * justo el que el usuario seleccionó en el select de al lado.
   */
  get telefonoEmpleado(): string {
    const indicativo = this.form.get('indicativo')?.value ?? '57';
    const local = (this.form.get('telefono')?.value ?? '').replace(/\D/g, '');
    return local ? `${indicativo}${local}` : '';
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

  private get mensajeCredenciales(): string {
    return encodeURIComponent(
      `Hola ${this.nombreCompleto}! 👋\n\n*Sastrería Andrés Chimunja*\n` +
      `Tus credenciales de acceso al sistema:\n\n` +
      `👤 Usuario: ${this.usernameEmpleado}\n` +
      `🔑 Contraseña temporal: ${this.claveGenerada}\n\n` +
      `⚠️ Cambia tu contraseña al ingresar por primera vez.`
    );
  }

  get urlWaEmpleado(): string {
    // telefonoEmpleado ya viene con el indicativo elegido concatenado --
    // no hace falta (ni conviene) adivinarlo de nuevo con telefonoConIndicativo().
    const tel = this.telefonoEmpleado;
    return tel ? `https://wa.me/${tel}?text=${this.mensajeCredenciales}` : '';
  }

  get urlWaAdmin(): string {
    const tel = telefonoConIndicativo(this.telefonoAdmin);
    return tel ? `https://wa.me/${tel}?text=${this.mensajeCredenciales}` : '';
  }

  abrirWaEmpleado(): void {
    if (this.urlWaEmpleado) window.open(this.urlWaEmpleado, '_blank');
  }

  abrirWaAdmin(): void {
    if (this.urlWaAdmin) window.open(this.urlWaAdmin, '_blank');
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
