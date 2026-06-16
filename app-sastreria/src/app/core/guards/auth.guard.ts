import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);

  // Permite acceder a /cambiar-clave aunque debaCambiar=true
  if (state.url.startsWith('/cambiar-clave')) return true;

  if (auth.mustChangePassword()) {
    return router.createUrlTree(['/cambiar-clave']);
  }

  return true;
};
