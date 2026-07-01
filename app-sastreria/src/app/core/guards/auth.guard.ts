import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const RUTAS_SOLO_ADMIN_ASISTENTE = [
  '/app/pedidos',
  '/app/clientes',
  '/app/crear-cliente',
  '/app/empleados',
  '/app/medidas',
  '/app/movimientos',
  '/app/metodosPago',
  '/app/tipoMovimientos',
  '/app/categoriaMovimientos',
  '/app/roles',
];

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);

  // Permite acceder a /cambiar-clave aunque debaCambiar=true
  if (state.url.startsWith('/cambiar-clave')) return true;

  if (auth.mustChangePassword()) {
    return router.createUrlTree(['/cambiar-clave']);
  }

  // Operario no puede acceder a rutas de admin/asistente
  if (auth.esOperario()) {
    const esForbidden = RUTAS_SOLO_ADMIN_ASISTENTE.some((r) => state.url.startsWith(r));
    if (esForbidden) return router.createUrlTree(['/app/mis-items']);
  }

  return true;
};
