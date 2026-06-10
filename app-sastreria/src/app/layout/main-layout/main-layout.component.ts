import { Component, OnInit, ViewChild } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  Router,
  NavigationEnd,
  RouterModule,
} from '@angular/router';
import {
  BreakpointObserver,
  Breakpoints,
  LayoutModule,
} from '@angular/cdk/layout';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

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
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatSidenav,
    LayoutModule,
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

  expanded = false;
  isMobile = false;
  isDarkMode = false;

  // Mapa ruta → nombre legible
  private routeTitles: Record<string, string> = {
    '/hoja-trabajo': 'Hoja de Trabajo',
    '/clientes': 'Clientes',
    '/empleados': 'Empleados',
    '/balance': 'Balance',
    '/gastos': 'Gastos',
    '/nomina': 'Nómina',
    '/movimientos': 'Movimientos',
  };
  constructor(
    private router: Router,
    private breakpointObserver: BreakpointObserver,
  ) {}

  ngOnInit() {
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    this.applyTheme();

    // Setear título en la carga inicial
    this.pageTitle = this.routeTitles[this.router.url] ?? 'Bienvenido Admin';

    // Actualizar en cada navegación
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const base = '/' + e.urlAfterRedirects.split('/')[1];

        this.pageTitle =
          this.routeTitles[e.urlAfterRedirects] ?? 'Bienvenido Admin';
      });
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;
        // En móvil cerramos el sidenav por defecto
        if (this.isMobile && this.sidenav) {
          this.sidenav.close();
        }
      });
  }
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark-mode', this.isDarkMode);
  }

  logout() {
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
