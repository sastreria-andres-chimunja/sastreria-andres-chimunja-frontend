import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recuperar-clave',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './recuperar-clave.component.html',
  styleUrl: './recuperar-clave.component.css',
})
export class RecuperarClaveComponent {
  form: FormGroup;
  isLoading = false;
  enviado = false;
  telefonoMasked = '';
  nombreEmpleado = '';
  waLink = '';
  errorMsg: string | null = null;
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
    });
  }

  recuperar(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.errorMsg = null;
    this.enviado = false;

    const username = this.form.get('username')!.value as string;
    this.authService.recuperarClave(username).subscribe({
      next: (resp) => {
        this.isLoading = false;
        const tel = resp.telefono.replace(/\D/g, '');
        const digits = tel.slice(-4);
        this.telefonoMasked = `****${digits}`;
        this.nombreEmpleado = resp.nombre;

        const msg = encodeURIComponent(
          `Hola ${resp.nombre}! 👋\n\n` +
          `Aquí están tus credenciales de acceso al sistema de Sastrería Andrés Chimunja:\n\n` +
          `🔑 *Usuario:* ${username}\n` +
          `🔐 *Contraseña temporal:* ${resp.claveTemp}\n\n` +
          `⚠️ Al ingresar por primera vez, el sistema te pedirá que cambies tu contraseña.\n\n` +
          `Ingresa en: ${window.location.origin}`
        );
        this.waLink = `https://wa.me/57${tel}?text=${msg}`;
        this.enviado = true;
        window.open(this.waLink, '_blank');
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.error ?? 'No se encontró el usuario.';
      },
    });
  }

  abrirWhatsApp(): void {
    if (this.waLink) window.open(this.waLink, '_blank');
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }
}
