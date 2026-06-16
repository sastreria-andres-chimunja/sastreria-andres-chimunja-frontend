import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

interface ReglaClave {
  label: string;
  check: (v: string) => boolean;
  met: boolean;
}

function clavePatronValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? '';
  const digits = (v.match(/\d/g) ?? []).length;
  const letters = (v.match(/[a-zA-Z]/g) ?? []).length;
  const upper = (v.match(/[A-Z]/g) ?? []).length;

  if (v.length < 8 || digits < 4 || letters < 4 || upper < 1) {
    return { patronInvalido: true };
  }
  return null;
}

function confirmarClaveValidator(group: AbstractControl): ValidationErrors | null {
  const nueva = group.get('claveNueva')?.value ?? '';
  const confirm = group.get('confirmar')?.value ?? '';
  return nueva && confirm && nueva !== confirm ? { noCoincide: true } : null;
}

@Component({
  selector: 'app-cambiar-clave',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cambiar-clave.component.html',
  styleUrl: './cambiar-clave.component.css',
})
export class CambiarClaveComponent implements OnInit {
  form!: FormGroup;
  hideNueva = true;
  hideConfirmar = true;
  isLoading = false;
  error = '';
  nombreUsuario = '';

  reglas: ReglaClave[] = [
    { label: 'Mínimo 8 caracteres',   check: v => v.length >= 8,                              met: false },
    { label: 'Al menos 4 dígitos',    check: v => (v.match(/\d/g) ?? []).length >= 4,          met: false },
    { label: 'Al menos 4 letras',     check: v => (v.match(/[a-zA-Z]/g) ?? []).length >= 4,    met: false },
    { label: 'Al menos 1 mayúscula',  check: v => (v.match(/[A-Z]/g) ?? []).length >= 1,       met: false },
  ];
  confirmaOk = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const sesion = this.authService.getSesion();
    this.nombreUsuario = sesion ? `${sesion.nombres} ${sesion.apellidos}` : '';

    this.form = this.fb.group(
      {
        claveNueva: ['', [Validators.required, clavePatronValidator]],
        confirmar: ['', Validators.required],
      },
      { validators: confirmarClaveValidator }
    );

    this.form.get('claveNueva')!.valueChanges.subscribe(v => {
      this.reglas.forEach(r => (r.met = r.check(v ?? '')));
      this.evalConfirma();
    });

    this.form.get('confirmar')!.valueChanges.subscribe(() => this.evalConfirma());
  }

  private evalConfirma(): void {
    const n = this.form.get('claveNueva')?.value ?? '';
    const c = this.form.get('confirmar')?.value ?? '';
    this.confirmaOk = n.length > 0 && c.length > 0 && n === c;
  }

  get todasLasReglasOk(): boolean {
    return this.reglas.every(r => r.met) && this.confirmaOk;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.todasLasReglasOk) return;

    this.isLoading = true;
    this.error = '';
    const idEmpleado = this.authService.getIdEmpleado()!;
    const claveNueva = this.form.get('claveNueva')!.value;

    this.authService.cambiarClaveInicial(idEmpleado, claveNueva).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/app'], { replaceUrl: true });
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.error ?? 'Error al cambiar la clave. Intenta de nuevo.';
      },
    });
  }
}
