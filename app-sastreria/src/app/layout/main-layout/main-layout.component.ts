import { Component, OnInit, ViewChild } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  Router,
  NavigationEnd,
  RouterModule,
} from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatSidenav,
    MatButtonModule,
    MatTooltipModule,
    CommonModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {
  pageTitle = 'Sistema de Gestión';
  @ViewChild('sidenav') sidenav!: MatSidenav;

  isDarkMode = false;

  private routeTitles: Record<string, string> = {
    '/app/pedidos': 'Hoja de trabajo',
    '/app/pedidos/crear': 'Nuevo pedido',
    '/app/clientes': 'Clientes',
    '/app/empleados': 'Empleados',
    '/app/nomina': 'Nómina',
    '/app/movimientos': 'Movimientos',
    '/app/metodosPago': 'Métodos de pago',
    '/app/categoriaMovimientos': 'Categorías de movimiento',
    '/app/roles': 'Roles',
    '/app/mis-items': 'Mis ítems',
    '/app/items': 'Ítems',
    '/app/limite-diario': 'Límite diario',
  };

  constructor(
    private router: Router,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    this.applyTheme();

    this.pageTitle = this.routeTitles[this.router.url] ?? 'Bienvenido';

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const url = e.urlAfterRedirects;
        if (this.routeTitles[url]) {
          this.pageTitle = this.routeTitles[url];
        } else if (url.startsWith('/app/pedidos/editar/')) {
          this.pageTitle = 'Editar pedido';
        } else if (url.startsWith('/app/medidas/')) {
          this.pageTitle = 'Medidas';
        } else {
          this.pageTitle = 'Sistema de Gestión';
        }
      });
  }

  get nombreUsuario(): string {
    const s = this.authService.getSesion();
    return s ? `${s.nombres} ${s.apellidos}` : '';
  }

  get nombreRol(): string {
    return this.authService.getNombreRol();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark-mode', this.isDarkMode);
  }

  getIniciales(): string {
    const s = this.authService.getSesion();
    if (!s) return '?';
    return `${s.nombres[0] ?? ''}${s.apellidos[0] ?? ''}`.toUpperCase();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
