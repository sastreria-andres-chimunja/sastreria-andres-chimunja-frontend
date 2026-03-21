// src/app/core/constants/constants.ts

export const ROUTES = {
  HOME: '/hoja-trabajo',
  CLIENTES: '/clientes',
  EMPLEADOS: '/empleados',
  BALANCE: '/balance',
  GASTOS: '/gastos',
  NOMINA: '/nomina',
  MOVIMIENTOS: '/movimientos',
} as const;

export const COLORS = {
  PRIMARY: '#2a2018',
  ACCENT: '#c8922a',
  BACKGROUND: '#f7f3ee',
  SURFACE: '#faf8f4',
  TEXT: '#3a2e20',
  TEXT_MUTED: '#8a7d6e',
} as const;

export const API = {
  BASE_URL: 'http://localhost:3000',
  CLIENTES: 'clientes',
  EMPLEADOS: 'empleados',
  MEDIDAS: 'medidas',
  IMAGENES: 'imagenes',
} as const;
