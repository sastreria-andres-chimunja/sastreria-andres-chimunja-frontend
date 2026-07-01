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
  isLoading      = false;
  enviado        = false;
  telefonoMasked = '';
  nombreEmpleado = '';
  urlWhatsApp    = '';
  errorMsg: string | null = null;
  currentYear    = new Date().getFullYear();

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
    this.errorMsg  = null;
    this.enviado   = false;

    const username = this.form.get('username')!.value as string;
    this.authService.recuperarClave(username).subscribe({
      next: (resp) => {
        this.isLoading      = false;
        const tel           = resp.telefono.replace(/\D/g, '');
        this.telefonoMasked = `****${tel.slice(-4)}`;
        this.nombreEmpleado = resp.nombre;
        const msg = encodeURIComponent(
          `Hola ${resp.nombre}! 👋\n\n*Sastrería Andrés Chimunja*\n` +
          `Tus credenciales de acceso al sistema:\n\n` +
          `👤 Usuario: ${username}\n` +
          `🔑 Contraseña temporal: ${resp.claveTemp}\n\n` +
          `⚠️ Cambia tu contraseña al ingresar por primera vez.`
        );
        this.urlWhatsApp = tel ? `https://wa.me/57${tel}?text=${msg}` : '';
        this.enviado     = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg  = err.error?.error ?? 'No se encontró el usuario.';
      },
    });
  }

  abrirWhatsApp(): void {
    if (this.urlWhatsApp) window.open(this.urlWhatsApp, '_blank');
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }
}
