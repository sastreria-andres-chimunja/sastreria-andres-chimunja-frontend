import { Injectable } from '@angular/core';
import * as qz from 'qz-tray';

/**
 * Impresión térmica directa vía QZ Tray (ESC/POS), sin pasar por el driver de
 * impresión de Windows. Evita los problemas de "Generic / Text Only": tildes
 * corruptas y logo que nunca imprime.
 *
 * Requiere que QZ Tray (https://qz.io) esté instalado y corriendo en el equipo
 * (ícono en la bandeja del sistema) antes de imprimir.
 */

const NOMBRE_IMPRESORA_KEY = 'qz_impresora_nombre';
const NOMBRE_IMPRESORA_DEFAULT = 'SAT TICKETS';
const ANCHO_COLUMNAS = 48; // 80mm, fuente A (12x24), típico en impresoras POS-80

const ESC = 0x1b;
const GS = 0x1d;

// Caracteres especiales en español → byte en codepage CP850. Confirmado
// contra la impresora física (clon POS-80 "SAT TICKETS"): estos valores de
// byte, combinados con CODEPAGE_TABLA=19, imprimen las tildes correctamente
// (se probó un diagnóstico imprimiendo estos mismos bytes bajo distintas
// tablas — 19 fue la única que los mostró bien en este modelo).
const CP850_MAP: Record<string, number> = {
  'á': 0xa0, 'é': 0x82, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3,
  'Á': 0xb5, 'É': 0x90, 'Í': 0xd6, 'Ó': 0xe0, 'Ú': 0xe9,
  'ñ': 0xa4, 'Ñ': 0xa5, 'ü': 0x81, 'Ü': 0x9a,
  '¿': 0xa8, '¡': 0xad, '°': 0xf8,
};

// Tabla de codepage seleccionada al iniciar cada impresión (comando ESC t n).
// 19 fue la que funcionó en la prueba real contra esta impresora — el número
// de tabla no sigue una convención universal entre fabricantes, así que este
// valor es específico del firmware de este modelo (clon POS-80 "SAT TICKETS").
const CODEPAGE_TABLA = 19;

type Align = 'L' | 'C' | 'R';

@Injectable({ providedIn: 'root' })
export class QzPrintService {
  private conectando: Promise<void> | null = null;

  private async asegurarConexion(): Promise<void> {
    if (qz.websocket.isActive()) return;
    if (!this.conectando) {
      this.conectando = qz.websocket.connect().catch((err: any) => {
        this.conectando = null;
        throw new Error(
          'No se pudo conectar con QZ Tray. Verifica que esté instalado y abierto ' +
            '(busca su ícono en la bandeja del sistema, junto al reloj de Windows).',
        );
      });
    }
    await this.conectando;
  }

  private async obtenerImpresora(): Promise<string> {
    const guardada = localStorage.getItem(NOMBRE_IMPRESORA_KEY);
    if (guardada) return guardada;

    try {
      const encontrada: string = await qz.printers.find(NOMBRE_IMPRESORA_DEFAULT);
      localStorage.setItem(NOMBRE_IMPRESORA_KEY, encontrada);
      return encontrada;
    } catch {
      const todas: string[] = await qz.printers.find();
      if (!todas || todas.length === 0) {
        throw new Error('QZ Tray no encontró ninguna impresora instalada en Windows.');
      }
      const listado = todas.map((n, i) => `${i + 1}. ${n}`).join('\n');
      const elegida = window.prompt(
        `No se encontró la impresora "${NOMBRE_IMPRESORA_DEFAULT}".\n` +
          `Impresoras disponibles:\n${listado}\n\nEscribe el nombre exacto a usar:`,
        todas[0],
      );
      if (!elegida || !todas.includes(elegida)) {
        throw new Error('No se seleccionó una impresora válida.');
      }
      localStorage.setItem(NOMBRE_IMPRESORA_KEY, elegida);
      return elegida;
    }
  }

  /** Permite forzar manualmente qué impresora usar (por si cambia de equipo o de impresora). */
  configurarImpresora(nombre: string): void {
    localStorage.setItem(NOMBRE_IMPRESORA_KEY, nombre);
  }

  // ── Construcción de comandos ESC/POS ────────────────────────────────────

  private textoACp850(texto: string): number[] {
    const bytes: number[] = [];
    for (const ch of texto) {
      const code = ch.codePointAt(0)!;
      if (code < 128) {
        bytes.push(code);
      } else if (CP850_MAP[ch] !== undefined) {
        bytes.push(CP850_MAP[ch]);
      } else {
        bytes.push(0x3f); // '?' para lo que no se pueda representar
      }
    }
    return bytes;
  }

  private linea(texto: string, opts: { align?: Align; bold?: boolean; doble?: boolean } = {}): number[] {
    const alineacion = opts.align === 'C' ? 1 : opts.align === 'R' ? 2 : 0;
    return [
      ESC, 0x61, alineacion,
      ESC, 0x45, opts.bold ? 1 : 0,
      GS, 0x21, opts.doble ? 0x11 : 0x00,
      ...this.textoACp850(texto),
      0x0a,
    ];
  }

  /** Línea con texto a la izquierda y a la derecha, útil para "TOTAL ... $1.000". */
  private columnas(izq: string, der: string, ancho = ANCHO_COLUMNAS): string {
    const espacio = Math.max(1, ancho - izq.length - der.length);
    return izq + ' '.repeat(espacio) + der;
  }

  private separador(caracter = '-'): number[] {
    return this.linea(caracter.repeat(ANCHO_COLUMNAS));
  }

  private bytesToBase64(bytes: number[]): string {
    let binario = '';
    for (const b of bytes) binario += String.fromCharCode(b);
    return btoa(binario);
  }

  // ── Recibo / orden de pedido ─────────────────────────────────────────────

  async imprimirRecibo(data: {
    idPedido: number;
    nombreCliente: string;
    telefonoCliente?: string;
    valorTotalPedido: number;
    valorAbono: number;
    totalPagadoPedido: number;
    metodoPago?: string;
    fechaEntrega?: string;
    items?: { descripcion: string; valor: number }[];
  }): Promise<void> {
    await this.asegurarConexion();
    const impresora = await this.obtenerImpresora();

    const esOrden = Array.isArray(data.items);
    const titulo = esOrden ? 'ORDEN DE PEDIDO' : 'RECIBO DE PAGO';
    const noOrden = String(data.idPedido).padStart(4, '0');
    const saldo = data.valorTotalPedido - data.totalPagadoPedido;

    const cmds: number[] = [
      ESC, 0x40, // init
      ESC, 0x74, CODEPAGE_TABLA, // seleccionar codepage
      ...this.linea('CONFECCIÓN DE PRENDAS A LA MEDIDA', { align: 'C' }),
      ...this.linea('ARREGLOS EN GENERAL', { align: 'C' }),
      ...this.linea('CEL: 311 380 1749', { align: 'C' }),
      ...this.linea('CALLE 15 NO. 13-47 - ARMENIA', { align: 'C' }),
      ...this.separador('='),
      ...this.linea(titulo, { align: 'C', bold: true }),
      ...this.separador('='),
      ...this.linea(`NO.: ${noOrden}`),
      ...this.linea(`FECHA ENTREGA: ${data.fechaEntrega ?? ''}`),
      ...this.linea(`CLIENTE: ${data.nombreCliente.toUpperCase()}`),
      ...(data.telefonoCliente ? this.linea(`TEL: ${data.telefonoCliente}`) : []),
      ...this.separador(),
    ];

    if (esOrden && data.items && data.items.length > 0) {
      data.items.forEach((it, i) => {
        cmds.push(...this.linea(`${i + 1}. ${it.descripcion.toUpperCase()}`));
        cmds.push(...this.linea(this.columnas('', this.formatCOP(it.valor)), { align: 'R' }));
      });
    } else if (esOrden) {
      cmds.push(...this.linea('SIN ÍTEMS REGISTRADOS', { align: 'C' }));
    } else {
      cmds.push(
        ...this.linea(`ABONO${data.metodoPago ? ' - ' + data.metodoPago.toUpperCase() : ''}`),
        ...this.linea(this.columnas('', this.formatCOP(data.valorAbono)), { align: 'R' }),
      );
    }

    cmds.push(
      ...this.separador(),
      ...this.linea(this.columnas('TOTAL:', this.formatCOP(data.valorTotalPedido)), { bold: true }),
      ...this.linea(this.columnas('ABONO:', `(-${this.formatCOP(data.totalPagadoPedido)})`)),
      ...this.separador(),
      ...this.linea(this.columnas('SALDO:', this.formatCOP(saldo)), { bold: true, doble: true }),
      ...this.separador('='),
      ...this.linea('DESPUÉS DE 7 DÍAS, NO SE RESPONDE POR GARANTÍA.', { align: 'C' }),
      ...this.linea('NO SE RESPONDE POR PRENDA NI SE HACE DEVOLUCIÓN', { align: 'C' }),
      ...this.linea('DE DINERO DESPUÉS DE 30 DÍAS.', { align: 'C' }),
      0x0a, 0x0a, 0x0a, 0x0a, 0x0a, 0x0a,
      GS, 0x56, 0x01, // corte parcial
    );

    await qz.print(qz.configs.create(impresora), [
      // Init + centrado ANTES de la imagen: si no, el logo hereda la
      // alineación que haya quedado de una impresión anterior (por eso a
      // veces salía sin centrar).
      { type: 'raw', format: 'base64', data: this.bytesToBase64([ESC, 0x40, ESC, 0x61, 1]) },
      {
        type: 'raw',
        format: 'image',
        data: `${window.location.origin}/assets/logo-sastreria-transparente.png`,
        options: { language: 'ESCPOS', dotDensity: 'double' },
      },
      { type: 'raw', format: 'base64', data: this.bytesToBase64(cmds) },
    ]);
  }

  // ── Comprobante de nómina ────────────────────────────────────────────────

  async imprimirNomina(data: {
    idPedido: number;
    nombreEmpleado: string;
    descripcion: string;
    valor: number;
    fechaPago: string;
    negocio?: string;
  }): Promise<void> {
    await this.asegurarConexion();
    const impresora = await this.obtenerImpresora();

    const cmds: number[] = [
      ESC, 0x40,
      ESC, 0x74, CODEPAGE_TABLA,
      ...this.linea(data.negocio ?? 'SASTRERÍA ANDRÉS CHIMUNJA', { align: 'C', bold: true }),
      ...this.linea('COMPROBANTE DE PAGO NÓMINA', { align: 'C' }),
      ...this.linea(data.fechaPago, { align: 'C' }),
      ...this.separador(),
      ...this.linea(`PEDIDO #: ${data.idPedido}`),
      ...this.linea(`EMPLEADO: ${data.nombreEmpleado.toUpperCase()}`),
      ...this.separador(),
      ...this.linea('ÍTEM:', { bold: true }),
      ...this.linea(data.descripcion),
      ...this.separador(),
      ...this.linea(this.columnas('VALOR PAGADO:', this.formatCOP(data.valor)), { bold: true, doble: true }),
      ...this.separador(),
      ...this.linea('PAGO REGISTRADO EXITOSAMENTE', { align: 'C' }),
      0x0a, 0x0a, 0x0a, 0x0a, 0x0a, 0x0a,
      GS, 0x56, 0x01,
    ];

    await qz.print(qz.configs.create(impresora), [
      { type: 'raw', format: 'base64', data: this.bytesToBase64(cmds) },
    ]);
  }

  private formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
