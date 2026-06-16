import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';

const REMEMBER_KEY = 'recordar_usuario';

@Component({
  selector: 'app-login',
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
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  isLoading = false;
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const usuarioRecordado = localStorage.getItem(REMEMBER_KEY) ?? '';

    this.loginForm = this.fb.group({
      username: [usuarioRecordado, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [!!usuarioRecordado],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const username  = this.loginForm.get('username')!.value as string;
    const clave     = this.loginForm.get('password')!.value as string;
    const recordar  = this.loginForm.get('rememberMe')!.value as boolean;

    if (recordar) {
      localStorage.setItem(REMEMBER_KEY, username);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    this.authService.login(username, clave).subscribe({
      next: (sesion) => {
        this.isLoading = false;
        if (sesion.debeCambiarClave) {
          this.router.navigate(['/cambiar-clave'], { replaceUrl: true });
        } else {
          this.router.navigate(['/app'], { replaceUrl: true });
        }
      },
      error: (err) => {
        this.isLoading = false;
        const mensaje: string = err.error?.error ?? 'Error al iniciar sesión. Intenta de nuevo.';
        Swal.fire({
          icon: 'error',
          title: 'Acceso denegado',
          text: mensaje,
          confirmButtonColor: '#8B6B3E',
        });
      },
    });
  }
}
