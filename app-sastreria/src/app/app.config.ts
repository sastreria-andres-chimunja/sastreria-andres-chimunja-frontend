import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';

import { routes } from './app.routes';

// Formato unificado dd/mm/yyyy para todo el proyecto
const APP_DATE_FORMATS = {
  parse: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
  },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { day: '2-digit', month: 'long', year: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideNativeDateAdapter(APP_DATE_FORMATS),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    // Los tooltips no deben reaccionar a gestos táctiles: en tarjetas
    // clicables (ej. resumen de Hoja de trabajo), el manejo de touch del
    // tooltip (long-press) interfería con el scroll normal de la página en
    // celular — el swipe que empezaba encima de esas tarjetas no scrolleaba.
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: { touchGestures: 'off' } },
  ],
};
