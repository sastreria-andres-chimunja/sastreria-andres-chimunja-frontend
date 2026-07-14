// src/app/core/constants/constants.ts

import { environment } from '../../environments/environment';

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
  BASE_URL: environment.apiUrl,
  AUTH: 'auth',
  CLIENTES: 'clientes',
  EMPLEADOS: 'empleado',
  MEDIDAS: 'medidas',
  IMAGENES: 'imagenes',
  ROL: 'roles',
  TIPO_MOVIMIENTO: 'tipoMovimiento',
  CATEGORIA_MOVIMIENTO: 'categoriaMovimiento',
  METODO_PAGO: 'metodoPago',
  MOVIMIENTOS: 'movimientos',
  NOMINA: 'nomina',
  PEDIDOS: 'pedidos',
  ITEM_PEDIDO: 'itemPedido',
  ESTADO: 'estado',
  TIPO_PEDIDO: 'tipoPedido',
  LIMITE_DIARIO: 'limiteDiario',
} as const;
