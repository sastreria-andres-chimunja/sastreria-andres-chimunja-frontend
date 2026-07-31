import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { API } from '../../utils/constants';
import { QzPrintService } from './qz-print.service';

export interface ReciboData {
  idPedido: number;
  idItemPedido: number;
  nombreCliente: string;
  telefonoCliente?: string;
  valorTotalPedido: number;
  valorAbono: number;
  totalPagadoPedido: number;
  metodoPago?: string;
  fechaPago: string;
  fechaEntrega?: string;
  items?: { descripcion: string; valor: number }[];
  negocio?: string;
}

export interface CredencialData {
  nombre: string;
  username: string;
  claveTemp: string;
}

export interface ReciboNominaData {
  idItemPedido: number;
  idPedido: number;
  nombreEmpleado: string;
  telefonoEmpleado?: string;
  descripcion: string;
  valor: number;
  fechaPago: string;
  negocio?: string;
}

@Injectable({ providedIn: 'root' })
export class ReciboService {

  constructor(private http: HttpClient, private qzPrint: QzPrintService) {}


  // ─── RECIBO CLIENTE ───────────────────────────────────────────────────────────

  private get logoUrl(): string {
    return `${window.location.origin}/assets/logo-sastreria-transparente.png`;
  }

  /** Logo pre-convertido a blanco/negro puro para impresión térmica (1-bit) — evita el tramado en puntos grises que sale con el logo a color. */
  private get logoUrlTermico(): string {
    return `${window.location.origin}/assets/logo-sastreria-termico.png`;
  }

  generarHtmlTermico(data: ReciboData, logoSrc?: string): string {
    const saldo     = data.valorTotalPedido - data.totalPagadoPedido;
    const esOrden   = Array.isArray(data.items);
    const titulo    = esOrden ? 'ORDEN DE PEDIDO' : 'RECIBO DE PAGO';
    const noOrden   = String(data.idPedido).padStart(4, '0');
    const imgSrc    = logoSrc ?? this.logoUrlTermico;

    const itemsHtml = esOrden
      ? (data.items!.length > 0
          ? data.items!.map((it, i) =>
              `<div class="item-row">
            <span class="item-num">${i + 1}.</span>
            <span class="item-desc">${it.descripcion.toUpperCase()}</span>
            <span class="item-val">${this.formatCOP(it.valor)}</span>
          </div>`).join('\n')
          : `<div style="font-size:9.5px;font-weight:700;text-align:center;padding:2px 0">Sin ítems registrados</div>`)
      : `<div class="item-row">
          <span class="item-num">1.</span>
          <span class="item-desc">ABONO AL PEDIDO${data.metodoPago ? ' – ' + data.metodoPago.toUpperCase() : ''}</span>
          <span class="item-val">${this.formatCOP(data.valorAbono)}</span>
        </div>`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    /*
     * Fuente sans-serif en negrita (no Courier New) a propósito: esta
     * plantilla se convierte a imagen de 1 bit para la impresora térmica
     * (ver generarImagenTermica() en este mismo archivo), y los trazos
     * delgados de una fuente monoespaciada a 8-9px se perdían/aclaraban al
     * reducirse a la resolución real del cabezal térmico — el texto salía
     * gris/débil aunque el umbral de blanco/negro ya fuera puro. Trazos más
     * gruesos y letra más grande sobreviven mejor esa reducción.
     */
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-weight: 700;
      font-size: 10.5px;
      width: 58mm;
      padding: 2mm 0.5mm 4mm;
      color: #000;
      background: #fff;
    }
    .c  { text-align: center; }
    .b  { font-weight: 700; }
    .hr-s { border-top: 2px solid #000; margin: 3px 0; }
    .hr-d { border-top: 1.5px solid #000; margin: 2px 0; }
    .logo { width: 38mm; height: auto; display: block; margin: 0 auto; }
    .h-info { font-size: 8.5px; }
    .doc-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; }
    .field     { display: flex; gap: 3px; margin: 2px 0; font-size: 9.5px; }
    .field-lbl { font-weight: 700; min-width: 52px; flex-shrink: 0; }
    .tbl-hdr  { display: flex; justify-content: space-between; font-weight: 700; font-size: 9.5px; }
    .item-row { display: flex; align-items: flex-start; gap: 2px; font-size: 9.5px; margin: 2.5px 0; }
    .item-num  { flex: 0 0 auto; font-weight: 700; }
    .item-desc { flex: 1; word-break: break-word; }
    .item-val  { flex: 0 0 auto; font-weight: 700; min-width: 46px; text-align: right; }
    .total-row { display: flex; justify-content: space-between; font-size: 10px; margin: 2px 0; }
    .total-saldo { font-size: 12px; font-weight: 700; }
    .footer { font-size: 9.5px; font-weight: 700; text-align: center; margin-top: 3px; line-height: 1.4; }
    @media print {
      @page { margin: 0; size: 58mm auto; }
      body  { width: 58mm; }
    }
  </style>
</head>
<body>
  <div class="c">
    <img class="logo" src="${imgSrc}" alt="Sastrería Andrés Chimunja" crossorigin="anonymous"/>
  </div>
  <div class="hr-s"></div>
  <div class="c">
    <div class="h-info">CONFECCIÓN DE PRENDAS A LA MEDIDA</div>
    <div class="h-info">ARREGLOS EN GENERAL</div>
    <div class="h-info">CEL: 311 380 1749</div>
    <div class="h-info">CALLE 15 NO. 13-47 – ARMENIA</div>
  </div>
  <div class="hr-s"></div>
  <div class="c doc-title">${titulo}</div>
  <div class="hr-s"></div>

  <div class="field"><span class="field-lbl">NO.:</span><span>${noOrden}</span></div>
  <div class="field"><span class="field-lbl" style="min-width:70px">FECHA ENTREGA:</span><span>${this.formatFecha(data.fechaEntrega ?? data.fechaPago)}</span></div>
  <div class="field"><span class="field-lbl">CLIENTE:</span><span>${data.nombreCliente.toUpperCase()}</span></div>
  ${data.telefonoCliente ? `<div class="field"><span class="field-lbl">TEL:</span><span>${data.telefonoCliente}</span></div>` : ''}

  <div class="hr-d"></div>
  <div class="tbl-hdr"><span>DESCRIPCIÓN</span><span>VALOR</span></div>
  <div class="hr-d"></div>
  ${itemsHtml}
  <div class="hr-d"></div>

  <div class="total-row"><span class="b">TOTAL:</span><span>${this.formatCOP(data.valorTotalPedido)}</span></div>
  <div class="total-row"><span class="b">ABONO:</span><span>(-${this.formatCOP(data.totalPagadoPedido)})</span></div>
  <div class="hr-d"></div>
  <div class="total-row total-saldo"><span>SALDO:</span><span>${this.formatCOP(saldo)}</span></div>
  <div class="hr-s"></div>

  <div class="footer">DESPUÉS DE 30 DÍAS NO SE RESPONDE POR NINGUNA PRENDA, Y PARA EFECTOS DE GARANTÍA, 7 DÍAS DESPUÉS DE LA ENTREGA. TIEMPO PARA RECOGER PRENDAS: 30 DÍAS. NO NOS HACEMOS RESPONSABLES.</div>
</body>
</html>`;
  }

  /**
   * Imprime el recibo/orden directo a la impresora térmica vía QZ Tray.
   * Se renderiza el recibo completo como una sola imagen ya convertida a
   * blanco/negro puro (igual que el logo): el texto en modo ESC/POS de esta
   * impresora sale gris/débil sin importar negrita o los parámetros de
   * calentamiento del cabezal (ESC 7) — no responde a esos ajustes. La
   * plantilla usa letra en negrita más grande (ver generarHtmlTermico) para
   * que los trazos sobrevivan la reducción a la resolución real del cabezal.
   * Si QZ Tray no está instalado/corriendo, cae al diálogo de impresión del
   * navegador (requiere que Windows tenga un driver de impresora configurado).
   */
  async imprimir(data: ReciboData): Promise<void> {
    try {
      const imagenDataUrl = await this.generarImagenTermica(data);
      await this.qzPrint.imprimirImagen(imagenDataUrl);
    } catch (err) {
      console.error('No se pudo imprimir vía QZ Tray, usando impresión del navegador:', err);
      this.imprimirNavegador(data);
    }
  }

  /** Renderiza generarHtmlTermico() a una imagen con umbral duro a blanco/negro puro (sin gris). */
  private async generarImagenTermica(data: ReciboData): Promise<string> {
    const html = this.generarHtmlTermico(data);

    const wrapper = document.createElement('div');
    // width:58mm duplicado a propósito: el CSS de generarHtmlTermico() trae
    // "body { width: 58mm; ... }", pero ese selector no aplica a este <div>
    // envoltorio (no es un <body> real) — sin este ancho explícito el
    // contenido no se restringe a 58mm y el recibo sale con proporciones
    // incorrectas. Mismo patrón ya usado en generarPDFBlob/generarImagenCredencial.
    wrapper.style.cssText = 'position:fixed;top:-9999px;left:0;width:58mm;background:#fff;box-sizing:border-box;';

    const parser  = new DOMParser();
    const docHtml = parser.parseFromString(html, 'text/html');
    wrapper.innerHTML = Array.from(docHtml.querySelectorAll('style')).map(s => s.outerHTML).join('')
      + docHtml.body.innerHTML;
    document.body.appendChild(wrapper);

    await this.esperarImagen(wrapper);

    try {
      const html2canvasModule = await import('html2canvas');
      const canvas = await html2canvasModule.default(wrapper, {
        scale: 3, useCORS: true, logging: false, backgroundColor: '#ffffff',
      });
      document.body.removeChild(wrapper);

      const ctx = canvas.getContext('2d')!;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = imgData.data;
      for (let i = 0; i < px.length; i += 4) {
        const luminancia = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        // Umbral generoso (190 de 255): clasifica como negro cualquier pixel
        // que no sea casi blanco puro, para que los bordes suavizados
        // (antialiasing) de la letra en negrita queden negros en vez de
        // aclararse a gris — trazos más gruesos sobreviven mejor la
        // reducción a la resolución real del cabezal térmico.
        const valor = luminancia < 190 ? 0 : 255;
        px[i] = px[i + 1] = px[i + 2] = valor;
        px[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      return canvas.toDataURL('image/png');
    } catch (err) {
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      throw err;
    }
  }

  private imprimirNavegador(data: ReciboData): void {
    const html = this.generarHtmlTermico(data);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;top:-200px;left:-200px;';
    document.body.appendChild(iframe);
    iframe.contentDocument!.open();
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();

    // Guard "impreso": onload/onerror y el setTimeout de respaldo (por si la
    // imagen nunca dispara onload) pueden ambos terminar llamando esta
    // función — sin este guard, una imagen que carga rápido (caso normal con
    // data URLs) imprime por onload y OTRA VEZ 3s después por el setTimeout
    // que nunca se canceló, abriendo el diálogo de impresión dos veces.
    let impreso = false;
    const ejecutarImpresion = () => {
      if (impreso) return;
      impreso = true;
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1500);
    };

    const img = iframe.contentDocument!.querySelector<HTMLImageElement>('img');
    if (img && !img.complete) {
      img.onload  = ejecutarImpresion;
      img.onerror = ejecutarImpresion;
      setTimeout(ejecutarImpresion, 3000);
    } else {
      setTimeout(ejecutarImpresion, 300);
    }
  }

  /**
   * Ticket adhesivo (10cm x 5cm) para pegar en la prenda — cliente, celular,
   * fecha de entrega, total/abono y saldo. Va a una impresora de etiquetas
   * distinta de la térmica de recibos, así que se imprime siempre vía el
   * diálogo de impresión del navegador/Windows (no hay ruta QZ Tray para
   * esta impresora todavía; se puede agregar más adelante en
   * qz-print.service.ts una vez se confirme el modelo/protocolo del
   * segundo equipo).
   */
  generarHtmlTicketAdhesivo(data: ReciboData, logoSrc?: string): string {
    const saldo  = data.valorTotalPedido - data.totalPagadoPedido;
    const imgSrc = logoSrc ?? this.logoUrlTermico;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-weight: 700;
      width: 100mm;
      height: 50mm;
      color: #000;
      background: #fff;
      display: flex;
      overflow: hidden;
    }
    .left-col {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 3mm 2mm 3mm 3.5mm;
    }
    .cliente-lbl { font-size: 10px; font-weight: 700; line-height: 1; }
    .cliente-nombre { font-size: 15px; font-weight: 700; line-height: 1.15; margin-top: 0.5mm; word-break: break-word; }
    .fila { font-size: 11.5px; font-weight: 700; margin-top: 1.5mm; line-height: 1; }
    .totales { margin-top: 2mm; }
    .fila-total { font-size: 12px; font-weight: 700; line-height: 1.3; margin-top: 1.8mm; }
    .fila-saldo { font-size: 14px; font-weight: 700; line-height: 1.3; margin-top: 1.8mm; }
    .right-col {
      width: 48mm;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2mm;
    }
    .logo-big { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
    @media print {
      @page { margin: 0; size: 100mm 50mm; }
      body { width: 100mm; height: 50mm; }
    }
  </style>
</head>
<body>
  <div class="left-col">
    <div>
      <div class="cliente-lbl">CLIENTE:</div>
      <div class="cliente-nombre">${data.nombreCliente.toUpperCase()}</div>
      ${data.telefonoCliente ? `<div class="fila">CELULAR: ${data.telefonoCliente}</div>` : ''}
      <div class="fila">ENTREGA: ${this.formatFechaEtiqueta(data.fechaEntrega ?? data.fechaPago)}</div>
    </div>
    <div class="totales">
      <div class="fila-total">TOTAL: ${this.formatCOP(data.valorTotalPedido)}</div>
      <div class="fila-total">ABONO${data.totalPagadoPedido > 0 ? ': ' + this.formatCOP(data.totalPagadoPedido) : ''}</div>
      <div class="fila-saldo">SALDO: ${this.formatCOP(saldo)}</div>
    </div>
  </div>
  <div class="right-col">
    <img class="logo-big" src="${imgSrc}" alt="Sastrería Andrés Chimunja" crossorigin="anonymous"/>
  </div>
</body>
</html>`;
  }

  /**
   * Imprime el ticket adhesivo directo por el diálogo de impresión del
   * navegador/Windows — SIN pasar por QZ Tray. Se descubrió que esta
   * impresora (SAT TT460, 203 dpi) usa protocolo ZPL, no ESC/POS: todo el
   * intento anterior con QZ Tray le mandaba comandos en el protocolo
   * equivocado. Además, Windows ya tiene instalado el driver real del
   * fabricante (via BarTender) — a diferencia de las pruebas iniciales, que
   * asumían un driver genérico "Generic/Text Only" sin soporte real de
   * imágenes. Por eso ya no se pre-convierte la imagen a blanco/negro puro
   * nosotros mismos (ver generarImagenTicket(), ahora sin uso aquí): ese
   * umbral duro le quitaba al driver correcto toda la información de gris
   * que necesita para tramar bien la imagen a la resolución real del
   * cabezal — se imprime el HTML tal cual, dejando que el driver haga esa
   * conversión (para lo que está diseñado).
   */
  async imprimirTicket(data: ReciboData): Promise<void> {
    this.imprimirTicketHtmlNavegador(data);
  }

  /** Renderiza generarHtmlTicketAdhesivo() a una imagen con umbral duro a blanco/negro puro (sin gris). */
  private async generarImagenTicket(data: ReciboData): Promise<string> {
    const html = this.generarHtmlTicketAdhesivo(data);

    const wrapper = document.createElement('div');
    // width/height/display duplicados a propósito (mismo motivo que en
    // generarImagenTermica()): el CSS de generarHtmlTicketAdhesivo() trae
    // "body { width:100mm; height:50mm; display:flex; ... }", que no aplica
    // a este <div> envoltorio por no ser un <body> real — sin duplicar
    // display:flex aquí, el logo se cae debajo del texto en vez de quedar
    // al lado (columna derecha).
    wrapper.style.cssText = 'position:fixed;top:-9999px;left:0;width:100mm;height:50mm;display:flex;overflow:hidden;background:#fff;box-sizing:border-box;';

    const parser  = new DOMParser();
    const docHtml = parser.parseFromString(html, 'text/html');
    wrapper.innerHTML = Array.from(docHtml.querySelectorAll('style')).map(s => s.outerHTML).join('')
      + docHtml.body.innerHTML;
    document.body.appendChild(wrapper);

    await this.esperarImagen(wrapper);

    try {
      const html2canvasModule = await import('html2canvas');
      const canvas = await html2canvasModule.default(wrapper, {
        // Misma escala que el recibo térmico (generarImagenTermica).
        scale: 3, useCORS: true, logging: false, backgroundColor: '#ffffff',
      });
      document.body.removeChild(wrapper);

      const ctx = canvas.getContext('2d')!;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = imgData.data;
      for (let i = 0; i < px.length; i += 4) {
        const luminancia = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        // Umbral duro a blanco/negro puro, igual que el recibo térmico —
        // ahora que este ticket también se manda directo por QZ Tray (ver
        // imprimirTicket()), el mismo tratamiento que ya funcionó bien ahí
        // debería funcionar igual aquí. La curva suavizada que se probó
        // antes era específicamente para compensar el reescalado del driver
        // de Windows, que ya no es el camino principal de impresión.
        const valor = luminancia < 190 ? 0 : 255;
        px[i] = px[i + 1] = px[i + 2] = valor;
        px[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      return canvas.toDataURL('image/png');
    } catch (err) {
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      throw err;
    }
  }

  /** Imprime una imagen ya renderizada del ticket, ocupando exactamente 100mm x 50mm. */
  private imprimirImagenTicketNavegador(dataUrl: string): void {
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>
  * { margin: 0; padding: 0; }
  body { width: 100mm; height: 50mm; }
  img { width: 100mm; height: 50mm; display: block; }
  @media print { @page { margin: 0; size: 100mm 50mm; } }
</style></head><body><img src="${dataUrl}"/></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;top:-200px;left:-200px;';
    document.body.appendChild(iframe);
    iframe.contentDocument!.open();
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();

    // Guard "impreso": onload/onerror y el setTimeout de respaldo (por si la
    // imagen nunca dispara onload) pueden ambos terminar llamando esta
    // función — sin este guard, una imagen que carga rápido (caso normal con
    // data URLs) imprime por onload y OTRA VEZ 3s después por el setTimeout
    // que nunca se canceló, abriendo el diálogo de impresión dos veces.
    let impreso = false;
    const ejecutarImpresion = () => {
      if (impreso) return;
      impreso = true;
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1500);
    };

    const img = iframe.contentDocument!.querySelector<HTMLImageElement>('img');
    if (img && !img.complete) {
      img.onload  = ejecutarImpresion;
      img.onerror = ejecutarImpresion;
      setTimeout(ejecutarImpresion, 3000);
    } else {
      setTimeout(ejecutarImpresion, 300);
    }
  }

  /** Respaldo: imprime el HTML del ticket directo (sin pasar por imagen), por si falla el render a imagen. */
  private imprimirTicketHtmlNavegador(data: ReciboData): void {
    const html = this.generarHtmlTicketAdhesivo(data);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;top:-200px;left:-200px;';
    document.body.appendChild(iframe);
    iframe.contentDocument!.open();
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();

    // Guard "impreso": onload/onerror y el setTimeout de respaldo (por si la
    // imagen nunca dispara onload) pueden ambos terminar llamando esta
    // función — sin este guard, una imagen que carga rápido (caso normal con
    // data URLs) imprime por onload y OTRA VEZ 3s después por el setTimeout
    // que nunca se canceló, abriendo el diálogo de impresión dos veces.
    let impreso = false;
    const ejecutarImpresion = () => {
      if (impreso) return;
      impreso = true;
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1500);
    };

    const img = iframe.contentDocument!.querySelector<HTMLImageElement>('img');
    if (img && !img.complete) {
      img.onload  = ejecutarImpresion;
      img.onerror = ejecutarImpresion;
      setTimeout(ejecutarImpresion, 3000);
    } else {
      setTimeout(ejecutarImpresion, 300);
    }
  }

  /** Genera la factura/orden como PDF A4 bonito (para WhatsApp). No toca el recibo de impresión. */
  async generarPDFBlob(data: ReciboData): Promise<File> {
    const html    = this.generarHtmlFacturaA4(data);
    const noOrden = String(data.idPedido).padStart(4, '0');
    const nombre  = `${(data.valorAbono ?? 0) > 0 ? 'recibo' : 'orden'}-pedido-${noOrden}.pdf`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText =
      'position:fixed;top:-9999px;left:0;width:794px;background:#fff;box-sizing:border-box;';

    const parser  = new DOMParser();
    const docHtml = parser.parseFromString(html, 'text/html');
    wrapper.innerHTML = Array.from(docHtml.querySelectorAll('style')).map(s => s.outerHTML).join('')
      + docHtml.body.innerHTML;
    document.body.appendChild(wrapper);

    await this.esperarImagen(wrapper);

    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const canvas = await html2canvasModule.default(wrapper, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
      });
      document.body.removeChild(wrapper);

      const imgData   = canvas.toDataURL('image/jpeg', 0.92);
      const anchoMm   = 210;
      const altoTotal = (canvas.height * anchoMm) / canvas.width;
      const altoA4    = 297;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      if (altoTotal <= altoA4) {
        pdf.addImage(imgData, 'JPEG', 0, 0, anchoMm, altoTotal);
      } else {
        let posY = 0;
        let restante = altoTotal;
        pdf.addImage(imgData, 'JPEG', 0, posY, anchoMm, altoTotal);
        restante -= altoA4;
        while (restante > 0) {
          posY -= altoA4;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, posY, anchoMm, altoTotal);
          restante -= altoA4;
        }
      }

      return new File([pdf.output('blob')], nombre, { type: 'application/pdf' });
    } catch (err) {
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      throw err;
    }
  }

  /** Genera la factura/orden A4 como imagen PNG en memoria (para WhatsApp: se ve grande de inmediato en el chat, como un comprobante bancario). */
  async generarImagenBlob(data: ReciboData): Promise<File> {
    const html    = this.generarHtmlFacturaA4(data);
    const noOrden = String(data.idPedido).padStart(4, '0');
    const nombre  = `${(data.valorAbono ?? 0) > 0 ? 'recibo' : 'orden'}-pedido-${noOrden}.png`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText =
      'position:fixed;top:-9999px;left:0;width:794px;background:#fff;box-sizing:border-box;';

    const parser  = new DOMParser();
    const docHtml = parser.parseFromString(html, 'text/html');
    wrapper.innerHTML = Array.from(docHtml.querySelectorAll('style')).map(s => s.outerHTML).join('')
      + docHtml.body.innerHTML;
    document.body.appendChild(wrapper);

    await this.esperarImagen(wrapper);

    try {
      const html2canvasModule = await import('html2canvas');
      const canvas = await html2canvasModule.default(wrapper, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
      });
      document.body.removeChild(wrapper);

      const blob = await new Promise<Blob>(res =>
        canvas.toBlob(b => res(b!), 'image/png'),
      );
      return new File([blob], nombre, { type: 'image/png' });
    } catch (err) {
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      throw err;
    }
  }

  /** HTML de factura A4 con diseño profesional (logo, colores, tabla). Solo para WhatsApp/PDF. */
  generarHtmlFacturaA4(data: ReciboData, logoSrc?: string): string {
    const saldo      = data.valorTotalPedido - data.totalPagadoPedido;
    const esAbono    = (data.valorAbono ?? 0) > 0;
    const titulo     = esAbono ? 'RECIBO DE PAGO' : 'ORDEN DE PEDIDO';
    const noOrden    = String(data.idPedido).padStart(4, '0');
    const imgSrc     = logoSrc ?? this.logoUrl;
    const pagado     = data.totalPagadoPedido;
    const tieneItems = Array.isArray(data.items) && data.items!.length > 0;

    // Filas de trabajo (siempre visibles cuando existen)
    const filasItems = tieneItems
      ? data.items!.map((it, i) => `
          <tr>
            <td class="num">${i + 1}</td>
            <td class="desc">${it.descripcion}</td>
            <td class="val">${this.formatCOP(it.valor)}</td>
          </tr>`).join('')
      : '';

    // Fila extra de abono (solo en recibo de pago)
    const filaAbono = esAbono
      ? `<tr style="border-top:2px solid #c8d8f0">
          <td class="num" style="color:#1a3580">✓</td>
          <td class="desc" style="color:#1a3580"><strong>Abono${data.metodoPago ? ' · ' + data.metodoPago : ''}</strong></td>
          <td class="val" style="color:#1a3580"><strong>${this.formatCOP(data.valorAbono)}</strong></td>
        </tr>`
      : '';

    const itemsHtml = (filasItems || filaAbono)
      ? filasItems + filaAbono
      : `<tr><td colspan="3" class="empty">Sin ítems registrados</td></tr>`;

    const infoCliente = [
      { lbl: 'Cliente',          val: data.nombreCliente },
      ...(data.telefonoCliente  ? [{ lbl: 'Teléfono',        val: data.telefonoCliente }] : []),
      ...(!esAbono              ? [{ lbl: 'Fecha de emisión', val: this.formatFechaLarga(data.fechaPago) }] : []),
      ...(data.fechaEntrega     ? [{ lbl: 'Fecha de entrega', val: this.formatFechaLarga(data.fechaEntrega), destacar: true }] : []),
      ...(data.metodoPago && esAbono ? [{ lbl: 'Método de pago', val: data.metodoPago }] : []),
    ].map(c => `
      <div class="info-cell">
        <div class="info-lbl">${c.lbl}</div>
        <div class="info-val${c.destacar ? ' info-val-entrega' : ''}">${c.val}</div>
      </div>`).join('');

    const pagoCompleto = saldo <= 0;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    width: 794px;
    background: #fff;
    color: #1a1a2e;
  }
  .page { padding: 40px 52px 40px; min-height: 1122px; display: flex; flex-direction: column; }

  /* HEADER */
  .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; }
  .logo-img { height:75px; width:auto; }
  .empresa { text-align:right; }
  .empresa-nombre { font-size:19px; font-weight:800; color:#1a3580; letter-spacing:0.4px; }
  .empresa-sub { font-size:11px; color:#666; margin-top:4px; line-height:1.55; }

  /* DIVIDER */
  .divider { height:3px; background:linear-gradient(90deg,#1a3580,#c9a84c,#1a3580); border-radius:2px; margin-bottom:22px; }

  /* TITLE BAND */
  .title-band {
    background:linear-gradient(90deg,#1a3580 0%,#2a52b0 50%,#1a3580 100%);
    color:#fff; border-radius:8px; padding:14px 24px;
    display:flex; justify-content:space-between; align-items:center;
    margin-bottom:22px;
  }
  .title-band h1 { font-size:15px; font-weight:800; letter-spacing:2.5px; text-transform:uppercase; }
  .doc-num { font-size:24px; font-weight:900; color:#c9a84c; letter-spacing:1px; }

  /* INFO GRID */
  .info-grid { display:flex; flex-wrap:wrap; gap:12px 24px; background:#f5f8ff; border:1px solid #dde4f5; border-radius:8px; padding:16px 22px; margin-bottom:24px; }
  .info-cell { flex:1 1 200px; }
  .info-lbl { font-size:9px; font-weight:700; letter-spacing:1.5px; color:#7a8cb0; text-transform:uppercase; margin-bottom:3px; }
  .info-val { font-size:14px; font-weight:600; color:#1a2744; }
  .info-val-entrega { font-size:19px; font-weight:800; color:#d32f2f; }

  /* TABLE */
  table.items { width:100%; border-collapse:collapse; margin-bottom:20px; }
  table.items thead tr { background:#1a3580; }
  table.items thead th {
    padding:10px 16px; font-size:11px; font-weight:700;
    letter-spacing:1px; color:#fff; text-align:left; text-transform:uppercase;
  }
  table.items thead th.val-h { text-align:right; }
  table.items tbody tr { border-bottom:1px solid #e8edf5; }
  table.items tbody tr:nth-child(even) { background:#f7f9ff; }
  table.items tbody td { padding:11px 16px; font-size:15px; font-weight:700; color:#2a3550; vertical-align:top; }
  td.num { width:36px; font-weight:700; color:#1a3580; font-size:15px; }
  td.desc { }
  td.val { text-align:right; font-weight:700; color:#1a2744; white-space:nowrap; }
  td.empty { text-align:center; color:#999; font-style:italic; padding:16px; }

  /* TOTALS */
  .totals-wrap { display:flex; justify-content:flex-end; margin-bottom:28px; }
  .totals-box { width:290px; border:1px solid #dde4f5; border-radius:8px; overflow:hidden; }
  .tot-row { display:flex; justify-content:space-between; align-items:center; padding:10px 18px; border-bottom:1px solid #eef1f8; font-size:13px; }
  .tot-row:last-child { border-bottom:none; }
  .tot-lbl { color:#7a8cb0; font-weight:600; }
  .tot-val { font-weight:700; color:#1a2744; }
  .tot-row.total-row { background:#f0f4ff; }
  .tot-row.total-row .tot-val { font-size:15px; color:#1a3580; }
  .tot-row.saldo-row { background:linear-gradient(90deg,#1a3580,#2a52b0); }
  .tot-row.saldo-row .tot-lbl { color:rgba(255,255,255,0.8); font-size:14px; font-weight:700; }
  .tot-row.saldo-row .tot-val { color:#c9a84c; font-size:20px; font-weight:900; }
  .tot-row.pagado-row { background:#e8f5e9; }
  .tot-row.pagado-row .tot-lbl { color:#2e7d32; }
  .tot-row.pagado-row .tot-val { color:#2e7d32; font-size:16px; }

  /* COMPLETE BADGE */
  .badge-pagado {
    display:flex; align-items:center; justify-content:center; gap:8px;
    background:#e8f5e9; border:2px solid #4caf50; border-radius:8px;
    padding:12px 20px; margin-bottom:24px;
    font-size:15px; font-weight:800; color:#2e7d32; letter-spacing:0.5px;
  }

  /* FOOTER */
  .spacer { flex:1; }
  .footer { border-top:2px solid #e0e6ef; padding-top:18px; margin-top:32px; }
  .footer-terms { font-size:16px; font-weight:700; color:#d32f2f; line-height:1.7; text-align:center; }
  .footer-brand { text-align:center; margin-top:10px; font-size:12px; font-weight:700; color:#1a3580; letter-spacing:0.3px; }
  .footer-sep { height:1px; background:#e0e6ef; margin:8px auto; width:60%; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <img class="logo-img" src="${imgSrc}" alt="Sastrería Andrés Chimunja" crossorigin="anonymous"/>
    <div class="empresa">
      <div class="empresa-nombre">Sastrería Andrés Chimunja</div>
      <div class="empresa-sub">
        Confección de prendas a la medida · Arreglos en general<br/>
        CEL: 311 380 1749 · Calle 15 No. 13-47, Armenia, Quindío
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="title-band">
    <h1>${titulo}</h1>
    <div class="doc-num">#${noOrden}</div>
  </div>

  <div class="info-grid">${infoCliente}</div>

  <table class="items">
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>Descripción</th>
        <th class="val-h">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  ${pagoCompleto ? `
  <div class="badge-pagado">
    ✅ PEDIDO PAGADO COMPLETAMENTE
  </div>` : ''}

  <div class="totals-wrap">
    <div class="totals-box">
      <div class="tot-row total-row">
        <span class="tot-lbl">Total</span>
        <span class="tot-val">${this.formatCOP(data.valorTotalPedido)}</span>
      </div>
      <div class="tot-row">
        <span class="tot-lbl">Total abonado</span>
        <span class="tot-val">(${this.formatCOP(pagado)})</span>
      </div>
      ${pagoCompleto
        ? `<div class="tot-row pagado-row">
            <span class="tot-lbl">✅ Pagado</span>
            <span class="tot-val">${this.formatCOP(pagado)}</span>
           </div>`
        : `<div class="tot-row saldo-row">
            <span class="tot-lbl">Saldo pendiente</span>
            <span class="tot-val">${this.formatCOP(saldo)}</span>
           </div>`
      }
    </div>
  </div>

  <div class="spacer"></div>

  <div class="footer">
    <div class="footer-terms">
      Después de 30 días no se responde por ninguna prenda, y para efectos de garantía, 7 días después de la entrega.<br/>
      Tiempo para recoger prendas: 30 días. No nos hacemos responsables.
    </div>
    <div class="footer-sep"></div>
    <div class="footer-brand">Sastrería Andrés Chimunja · Armenia, Quindío · CEL: 311 380 1749</div>
  </div>

</div>
</body>
</html>`;
  }

  /**
   * Comparte un archivo por WhatsApp de la forma más directa posible según el dispositivo.
   *
   * - Móvil (Android/iOS): Web Share API → el archivo va adjunto directo a WhatsApp.
   * - PC + imagen PNG:      Copia la imagen al portapapeles y abre WhatsApp Web
   *                         en el contacto → solo pegar Ctrl+V y enviar.
   * - PC + PDF / fallback:  Descarga el archivo y abre wa.me con texto prefijado.
   *
   * Valores de retorno:
   *   null            → Web Share usada con éxito (nada más que hacer)
   *   '_clipboard_'   → Imagen copiada; WhatsApp Web abierto (mostrar aviso Ctrl+V)
   *   string (URL)    → Fallback: mostrar botón "Abrir WhatsApp"
   */
  async compartirConWhatsApp(
    archivo: File,
    telefono: string,
    texto: string,
  ): Promise<string | null> {
    const tel      = telefono.replace(/\D/g, '');
    const waWebUrl = tel
      ? `https://web.whatsapp.com/send?phone=57${tel}`
      : `https://web.whatsapp.com/`;
    const waUrl = tel
      ? `https://wa.me/57${tel}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;

    // ── Móvil: Web Share API ────────────────────────────────────────────────
    const esMobil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const nav     = navigator as any;
    if (esMobil && typeof nav.canShare === 'function' && nav.canShare({ files: [archivo] })) {
      try {
        await nav.share({ files: [archivo], text: texto });
        return null;
      } catch (e: any) {
        if (e?.name === 'AbortError') return null;
        // Otro error → continuar con opciones de PC
      }
    }

    // ── PC + imagen PNG: portapapeles → WhatsApp Web ────────────────────────
    if (archivo.type === 'image/png'
      && typeof ClipboardItem !== 'undefined'
      && typeof navigator.clipboard?.write === 'function') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': archivo }),
        ]);
        window.open(waWebUrl, '_blank');
        return '_clipboard_';
      } catch {
        // Portapapeles no disponible → fallback
      }
    }

    // ── Fallback: descargar + wa.me ─────────────────────────────────────────
    this.descargarBlob(archivo, archivo.name);
    return waUrl;
  }

  // ─── CREDENCIALES DE ACCESO ───────────────────────────────────────────────────

  generarHtmlCredencial(data: CredencialData): string {
    const logoSrc = this.logoUrl;
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: #eef1f6;
      padding: 20px;
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      width: 400px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      overflow: hidden;
      width: 360px;
    }
    /* Área del logo */
    .logo-area {
      background: #ffffff;
      padding: 22px 24px 14px;
      text-align: center;
      border-bottom: 4px solid #1a3580;
    }
    .logo { width: 150px; height: auto; }
    /* Banda dorada con título */
    .title-band {
      background: linear-gradient(90deg, #9a6f00 0%, #c9a84c 45%, #9a6f00 100%);
      padding: 11px 20px;
      text-align: center;
    }
    .title-band h1 {
      font-size: 12.5px;
      font-weight: 800;
      letter-spacing: 2.5px;
      color: #fff;
      text-transform: uppercase;
      text-shadow: 0 1px 3px rgba(0,0,0,0.35);
    }
    .title-band p {
      font-size: 9px;
      color: rgba(255,255,255,0.85);
      letter-spacing: 1px;
      margin-top: 2px;
    }
    /* Cuerpo */
    .card-body { padding: 20px 24px 16px; }
    .field-group { margin-bottom: 13px; }
    .field-label {
      font-size: 8px;
      letter-spacing: 1.5px;
      color: #8a9bb0;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 3px;
    }
    .field-value {
      font-size: 17px;
      font-weight: 700;
      color: #1a2744;
      line-height: 1.2;
    }
    .field-value.mono {
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      color: #1a3580;
      background: #f3f6fb;
      padding: 5px 10px;
      border-radius: 6px;
      display: inline-block;
      margin-top: 2px;
      letter-spacing: 1px;
    }
    .sep { height: 1px; background: #e8ecf0; margin: 11px 0; }
    /* Contraseña */
    .pass-label {
      font-size: 8px;
      letter-spacing: 1.5px;
      color: #8a9bb0;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .pass-box {
      background: #fffbee;
      border: 3px solid #c9a84c;
      border-radius: 10px;
      padding: 14px 12px;
      text-align: center;
    }
    .pass-text {
      font-family: 'Courier New', Courier, monospace;
      font-size: 30px;
      font-weight: 900;
      letter-spacing: 5px;
      color: #1a2744;
    }
    .pass-hint {
      font-size: 8.5px;
      color: #b8a060;
      margin-top: 5px;
      letter-spacing: 0.3px;
    }
    /* Aviso */
    .warning {
      background: #fff8e1;
      border-left: 4px solid #f59e0b;
      border-radius: 0 8px 8px 0;
      padding: 9px 12px;
      margin-top: 13px;
      font-size: 10px;
      color: #7a5c0a;
      line-height: 1.45;
    }
    /* Footer */
    .card-footer {
      background: #f5f7fb;
      border-top: 1px solid #e0e6ef;
      padding: 12px 24px;
      text-align: center;
    }
    .footer-brand {
      font-size: 11px;
      font-weight: 700;
      color: #1a3580;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .footer-text {
      font-size: 9px;
      color: #9aa5b1;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-area">
      <img class="logo" src="${logoSrc}" alt="Sastrería Andrés Chimunja" crossorigin="anonymous"/>
    </div>
    <div class="title-band">
      <h1>Credenciales de Acceso</h1>
      <p>Sistema de Gestión</p>
    </div>
    <div class="card-body">
      <div class="field-group">
        <div class="field-label">Empleado</div>
        <div class="field-value">${data.nombre}</div>
      </div>
      <div class="sep"></div>
      <div class="field-group">
        <div class="field-label">Usuario del sistema</div>
        <div class="field-value mono">${data.username}</div>
      </div>
      <div class="sep"></div>
      <div class="pass-label">Contraseña temporal</div>
      <div class="pass-box">
        <div class="pass-text">${data.claveTemp}</div>
        <div class="pass-hint">Contraseña de un solo uso · No la compartas</div>
      </div>
      <div class="warning">
        <strong>⚠️ Importante:</strong> Al ingresar por primera vez, el sistema te pedirá cambiar esta contraseña.
      </div>
    </div>
    <div class="card-footer">
      <div class="footer-brand">Sastrería Andrés Chimunja</div>
      <div class="footer-text">
        Confección de prendas a la medida · Armenia, Quindío<br/>
        CEL: 311 380 1749 · Calle 15 No. 13-47
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /** Genera la tarjeta de credenciales como imagen PNG (File en memoria, SIN descargar). */
  async generarImagenCredencial(data: CredencialData): Promise<File> {
    const html    = this.generarHtmlCredencial(data);
    const nombre  = `credenciales-${data.username}.png`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;top:-9999px;left:0;width:400px;';

    const parser  = new DOMParser();
    const docHtml = parser.parseFromString(html, 'text/html');
    wrapper.innerHTML = Array.from(docHtml.querySelectorAll('style')).map(s => s.outerHTML).join('')
      + docHtml.body.innerHTML;
    document.body.appendChild(wrapper);

    await this.esperarImagen(wrapper);

    try {
      const html2canvasModule = await import('html2canvas');
      const canvas = await html2canvasModule.default(wrapper, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#eef1f6',
      });
      document.body.removeChild(wrapper);

      const blob = await new Promise<Blob>(res =>
        canvas.toBlob(b => res(b!), 'image/png'),
      );
      return new File([blob], nombre, { type: 'image/png' });
    } catch (err) {
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      throw err;
    }
  }

  // ─── RECIBO NÓMINA (EMPLEADO) ─────────────────────────────────────────────────

  generarHtmlTermicoNomina(data: ReciboNominaData): string {
    const negocio = data.negocio ?? 'Sastrería Andrés Chimunja';
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Comprobante de pago nómina</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      width: 58mm;
      padding: 4mm;
      color: #000;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 3px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .title { font-size: 13px; font-weight: bold; margin-bottom: 4px; }
    .sub { font-size: 10px; color: #444; }
    .valor-row { font-size: 13px; font-weight: bold; color: #060; }
    @media print {
      body { width: 58mm; }
      @page { margin: 0; size: 58mm auto; }
    }
  </style>
</head>
<body>
  <div class="center bold title">${negocio}</div>
  <div class="center sub">Comprobante de Pago Nómina</div>
  <div class="center sub">${data.fechaPago}</div>
  <div class="line"></div>
  <div class="row"><span>Pedido #:</span><span>${data.idPedido}</span></div>
  <div class="row"><span>Empleado:</span><span>${data.nombreEmpleado}</span></div>
  <div class="line"></div>
  <div style="margin: 3px 0;">
    <span class="bold">Ítem:</span><br/>
    <span>${data.descripcion}</span>
  </div>
  <div class="line"></div>
  <div class="row valor-row">
    <span>Valor pagado:</span>
    <span>${this.formatCOP(data.valor)}</span>
  </div>
  <div class="line"></div>
  <div class="center sub">Pago registrado exitosamente</div>
</body>
</html>`;
  }

  /** Igual que imprimir(), pero para el comprobante de pago de nómina. */
  async imprimirNomina(data: ReciboNominaData): Promise<void> {
    try {
      await this.qzPrint.imprimirNomina(data);
    } catch (err) {
      console.error('No se pudo imprimir vía QZ Tray, usando impresión del navegador:', err);
      this.imprimirNominaNavegador(data);
    }
  }

  private imprimirNominaNavegador(data: ReciboNominaData): void {
    const html = this.generarHtmlTermicoNomina(data);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;top:-200px;left:-200px;';
    document.body.appendChild(iframe);
    iframe.contentDocument!.open();
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();
    setTimeout(() => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1500);
    }, 300);
  }

  generarTextoWhatsApp(data: ReciboData): string {
    const saldo   = data.valorTotalPedido - data.totalPagadoPedido;
    const esOrden = Array.isArray(data.items);
    const titulo  = esOrden ? 'Orden de Pedido' : 'Recibo de Pago';
    const noOrden = String(data.idPedido).padStart(4, '0');

    // String.fromCodePoint garantiza encoding correcto sin depender del charset del archivo
    const em = {
      aguja:    String.fromCodePoint(0x1F9F5),         // 🧵
      telefono: String.fromCodePoint(0x1F4DE),         // 📞
      clip:     String.fromCodePoint(0x1F4CB),         // 📋
      fecha:    String.fromCodePoint(0x1F4C5),         // 📅
      persona:  String.fromCodePoint(0x1F464),         // 👤
      movil:    String.fromCodePoint(0x1F4F1),         // 📱
      lapiz:    String.fromCodePoint(0x1F4DD),         // 📝
      total:    String.fromCodePoint(0x1F4B0),         // 💰
      dinero:   String.fromCodePoint(0x1F4B5),         // 💵
      tarjeta:  String.fromCodePoint(0x1F4B3),         // 💳
      alerta:   String.fromCodePoint(0x26A0, 0xFE0F),  // ⚠️
      check:    String.fromCodePoint(0x2705),          // ✅
    };

    const itemsLineas = esOrden && data.items!.length > 0
      ? data.items!.map((it, i) => `   ${i + 1}. ${it.descripcion} — ${this.formatCOP(it.valor)}`)
      : [];

    const lineas: string[] = [
      `${em.aguja} *SASTRERÍA ANDRÉS CHIMUNJA*`,
      `_CONFECCIÓN DE PRENDAS A LA MEDIDA_`,
      `${em.telefono} CEL: 311 380 1749`,
      ``,
      `${em.clip} *${titulo} #${noOrden}*`,
      `${em.fecha} Fecha de entrega: ${this.formatFecha(data.fechaEntrega ?? data.fechaPago)}`,
      `${em.persona} Cliente: ${data.nombreCliente}`,
      ...(data.telefonoCliente ? [`${em.movil} Tel: ${data.telefonoCliente}`] : []),
      ...(itemsLineas.length   ? [``, `${em.lapiz} *Descripción:*`, ...itemsLineas] : []),
      ``,
      `${em.total} Total:  ${this.formatCOP(data.valorTotalPedido)}`,
      `${em.dinero} Abono:  ${this.formatCOP(data.totalPagadoPedido)}`,
      saldo > 0
        ? `${em.alerta} Saldo:  ${this.formatCOP(saldo)}`
        : `${em.check} *¡PEDIDO PAGADO COMPLETAMENTE!*`,
      ...(data.metodoPago ? [`${em.tarjeta} Método: ${data.metodoPago}`] : []),
      ``,
      `_Después de 30 días no se responde por ninguna prenda, y para efectos de garantía, 7 días después de la entrega. Tiempo para recoger prendas: 30 días. No nos hacemos responsables._`,
    ];
    return lineas.join('\n');
  }

  generarTextoWhatsAppNomina(data: ReciboNominaData): string {
    const negocio = data.negocio ?? 'Sastrería Andrés Chimunja';

    // String.fromCodePoint garantiza encoding correcto sin depender del charset del archivo
    const em = {
      tijeras:  String.fromCodePoint(0x2702, 0xFE0F), // ✂️
      check:    String.fromCodePoint(0x2705),          // ✅
      dinero:   String.fromCodePoint(0x1F4B5),         // 💵
      persona:  String.fromCodePoint(0x1F464),         // 👤
      clip:     String.fromCodePoint(0x1F4CB),         // 📋
      pin:      String.fromCodePoint(0x1F4CC),         // 📌
      fecha:    String.fromCodePoint(0x1F4C5),         // 📅
    };

    const sep = String.fromCodePoint(0x2500).repeat(26); // ──────────────────────────

    const lineas = [
      `${em.tijeras} *${negocio.toUpperCase()}*`,
      `_Confección de prendas a la medida_`,
      ``,
      `${em.clip} *COMPROBANTE DE PAGO NÓMINA*`,
      `${em.fecha} ${data.fechaPago}`,
      sep,
      `${em.persona} *Empleado:* ${data.nombreEmpleado}`,
      `${em.clip} *Pedido:* #${data.idPedido}`,
      `${em.pin} *Trabajo:*`,
      `_${data.descripcion}_`,
      sep,
      `${em.dinero} *Valor pagado: ${this.formatCOP(data.valor)}*`,
      sep,
      `${em.check} _Pago registrado exitosamente_`,
    ];
    return lineas.join('\n');
  }

  abrirWhatsApp(data: ReciboData, telefono?: string): void {
    const texto = encodeURIComponent(this.generarTextoWhatsApp(data));
    const tel = (telefono ?? '').replace(/\D/g, '');
    const url = tel
      ? `https://wa.me/57${tel}?text=${texto}`
      : `https://wa.me/?text=${texto}`;
    window.open(url, '_blank');
  }

  abrirWhatsAppNomina(data: ReciboNominaData, telefono?: string): void {
    const texto = encodeURIComponent(this.generarTextoWhatsAppNomina(data));
    const tel = (telefono ?? '').replace(/\D/g, '');
    const url = tel
      ? `https://wa.me/57${tel}?text=${texto}`
      : `https://wa.me/?text=${texto}`;
    window.open(url, '_blank');
  }

  /** HTML A4 profesional para comprobante de pago de nómina (empleado). */
  generarHtmlFacturaA4Nomina(data: ReciboNominaData, logoSrc?: string): string {
    const negocio = data.negocio ?? 'Sastrería Andrés Chimunja';
    const noOrden = String(data.idPedido).padStart(4, '0');
    const imgSrc  = logoSrc ?? this.logoUrl;

    const infoEmpleado = [
      { lbl: 'Empleado',      val: data.nombreEmpleado },
      ...(data.telefonoEmpleado ? [{ lbl: 'Teléfono', val: data.telefonoEmpleado }] : []),
      { lbl: 'Fecha de pago', val: this.formatFechaLarga(data.fechaPago) },
      { lbl: 'Pedido',        val: `#${noOrden}` },
    ].map(c => `
      <div class="info-cell">
        <div class="info-lbl">${c.lbl}</div>
        <div class="info-val">${c.val}</div>
      </div>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif; font-size:13px; width:794px; background:#fff; color:#1a1a2e; }
  .page { padding:40px 52px 40px; min-height:1122px; display:flex; flex-direction:column; }
  .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; }
  .logo-img { height:75px; width:auto; }
  .empresa { text-align:right; }
  .empresa-nombre { font-size:19px; font-weight:800; color:#1a3580; letter-spacing:0.4px; }
  .empresa-sub { font-size:11px; color:#666; margin-top:4px; line-height:1.55; }
  .divider { height:3px; background:linear-gradient(90deg,#1a3580,#c9a84c,#1a3580); border-radius:2px; margin-bottom:22px; }
  .title-band { background:linear-gradient(90deg,#1a3580 0%,#2a52b0 50%,#1a3580 100%); color:#fff; border-radius:8px; padding:14px 24px; display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; }
  .title-band h1 { font-size:15px; font-weight:800; letter-spacing:2.5px; text-transform:uppercase; }
  .doc-num { font-size:13px; font-weight:600; opacity:0.85; }
  .info-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px 20px; margin-bottom:24px; }
  .info-cell { display:flex; flex-direction:column; gap:2px; }
  .info-lbl { font-size:9px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#8a9bb0; }
  .info-val { font-size:14px; font-weight:600; color:#1a2744; }
  .items { width:100%; border-collapse:collapse; margin-bottom:24px; }
  .items th { background:#f3f6fb; color:#1a3580; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:10px 12px; text-align:left; }
  .items td { padding:11px 12px; border-bottom:1px solid #eaedf3; font-size:13px; color:#2c3e60; vertical-align:top; }
  .items tr:last-child td { border-bottom:none; }
  .num { width:40px; text-align:center; color:#8a9bb0; font-size:12px; }
  .val { width:140px; text-align:right; font-weight:600; }
  .badge-pagado { text-align:center; background:#e8f5e9; color:#1b5e20; border:2px solid #a5d6a7; border-radius:8px; padding:10px 16px; font-size:13px; font-weight:800; margin-bottom:20px; letter-spacing:0.5px; }
  .totals-wrap { display:flex; justify-content:flex-end; }
  .totals-box { background:#f3f6fb; border-radius:10px; padding:16px 24px; min-width:240px; display:flex; flex-direction:column; gap:8px; }
  .tot-row { display:flex; justify-content:space-between; gap:24px; font-size:13px; color:#4a5568; }
  .total-row { font-size:15px; font-weight:800; color:#1a3580; border-bottom:2px solid #dde5f0; padding-bottom:8px; margin-bottom:4px; }
  .pagado-row { color:#2e7d32; font-weight:700; }
  .spacer { flex:1; }
  .footer { margin-top:28px; }
  .footer-sep { height:1px; background:#dde5f0; margin:8px 0; }
  .footer-brand { text-align:center; font-size:10px; color:#8a9bb0; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <img class="logo-img" src="${imgSrc}" alt="Logo"/>
    <div class="empresa">
      <div class="empresa-nombre">${negocio}</div>
      <div class="empresa-sub">Confección de prendas a la medida<br/>Armenia, Quindío · CEL: 311 380 1749</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="title-band">
    <h1>Comprobante de Pago</h1>
    <div class="doc-num">Pedido #${noOrden}</div>
  </div>

  <div class="info-grid">${infoEmpleado}</div>

  <table class="items">
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>Descripción del trabajo</th>
        <th class="val">Valor pagado</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="num">1</td>
        <td>${data.descripcion}</td>
        <td class="val">${this.formatCOP(data.valor)}</td>
      </tr>
    </tbody>
  </table>

  <div class="badge-pagado">✅ PAGO REGISTRADO EXITOSAMENTE</div>

  <div class="totals-wrap">
    <div class="totals-box">
      <div class="tot-row total-row">
        <span>Total pagado</span>
        <span>${this.formatCOP(data.valor)}</span>
      </div>
      <div class="tot-row pagado-row">
        <span>✅ Acreditado</span>
        <span>${this.formatCOP(data.valor)}</span>
      </div>
    </div>
  </div>

  <div class="spacer"></div>

  <div class="footer">
    <div class="footer-sep"></div>
    <div class="footer-brand">${negocio} · Armenia, Quindío · CEL: 311 380 1749</div>
  </div>

</div>
</body>
</html>`;
  }

  /** Genera el comprobante de nómina como PDF A4. */
  async generarPDFBlobNomina(data: ReciboNominaData): Promise<File> {
    const html    = this.generarHtmlFacturaA4Nomina(data);
    const noOrden = String(data.idPedido).padStart(4, '0');
    const nombre  = `comprobante-nomina-${noOrden}.pdf`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText =
      'position:fixed;top:-9999px;left:0;width:794px;background:#fff;box-sizing:border-box;';

    const parser  = new DOMParser();
    const docHtml = parser.parseFromString(html, 'text/html');
    wrapper.innerHTML = Array.from(docHtml.querySelectorAll('style')).map(s => s.outerHTML).join('')
      + docHtml.body.innerHTML;
    document.body.appendChild(wrapper);

    await this.esperarImagen(wrapper);

    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const canvas = await html2canvasModule.default(wrapper, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
      });
      document.body.removeChild(wrapper);

      const imgData   = canvas.toDataURL('image/jpeg', 0.92);
      const anchoMm   = 210;
      const altoTotal = (canvas.height * anchoMm) / canvas.width;
      const altoA4    = 297;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      if (altoTotal <= altoA4) {
        pdf.addImage(imgData, 'JPEG', 0, 0, anchoMm, altoTotal);
      } else {
        let posY = 0;
        let restante = altoTotal;
        pdf.addImage(imgData, 'JPEG', 0, posY, anchoMm, altoTotal);
        restante -= altoA4;
        while (restante > 0) {
          posY -= altoA4;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, posY, anchoMm, altoTotal);
          restante -= altoA4;
        }
      }

      return new File([pdf.output('blob')], nombre, { type: 'application/pdf' });
    } catch (err) {
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      throw err;
    }
  }

  /** Genera el comprobante de nómina como imagen PNG en memoria (para WhatsApp). */
  async generarImagenBlobNomina(data: ReciboNominaData): Promise<File> {
    const html    = this.generarHtmlFacturaA4Nomina(data);
    const noOrden = String(data.idPedido).padStart(4, '0');
    const nombre  = `comprobante-nomina-${noOrden}.png`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText =
      'position:fixed;top:-9999px;left:0;width:794px;background:#fff;box-sizing:border-box;';

    const parser  = new DOMParser();
    const docHtml = parser.parseFromString(html, 'text/html');
    wrapper.innerHTML = Array.from(docHtml.querySelectorAll('style')).map(s => s.outerHTML).join('')
      + docHtml.body.innerHTML;
    document.body.appendChild(wrapper);

    await this.esperarImagen(wrapper);

    try {
      const html2canvasModule = await import('html2canvas');
      const canvas = await html2canvasModule.default(wrapper, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
      });
      document.body.removeChild(wrapper);

      const blob = await new Promise<Blob>(res =>
        canvas.toBlob(b => res(b!), 'image/png'),
      );
      return new File([blob], nombre, { type: 'image/png' });
    } catch (err) {
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      throw err;
    }
  }

  // ─── ENVÍO AUTOMÁTICO VÍA BACKEND (META CLOUD API) ───────────────────────────

  /**
   * Envía una imagen al número de WhatsApp indicado usando el backend
   * con Meta Cloud API. 100% automático, sin intervención del usuario.
   * Lanza error si el backend no está configurado o el envío falla.
   */
  async enviarViaBackend(archivo: File, telefono: string, caption: string): Promise<void> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    });

    const tel = telefono.replace(/\D/g, '').replace(/^57/, '');

    await lastValueFrom(
      this.http.post(`${API.BASE_URL}/whatsapp/enviar`, {
        telefono: tel,
        imagenBase64: base64,
        caption,
      }),
    );
  }

  // ─── PRIVADOS ────────────────────────────────────────────────────────────────

  private esperarImagen(container: HTMLElement): Promise<void> {
    return new Promise<void>(resolve => {
      const img = container.querySelector<HTMLImageElement>('img');
      if (!img || img.complete) { resolve(); return; }
      img.onload  = () => resolve();
      img.onerror = () => resolve();
      setTimeout(resolve, 3000);
    });
  }

  descargarBlob(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private formatFecha(dateStr?: string): string {
    if (!dateStr) return '';
    const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    const partes = dateStr.replace(/-/g, '/').split('/');
    if (partes.length === 3) {
      const a = Number(partes[0]), b = Number(partes[1]), c = Number(partes[2]);
      if (!isNaN(a) && !isNaN(b) && !isNaN(c)) {
        const [dia, mes, anio] = a > 31 ? [c, b, a] : [a, b, c];
        return `${dia} - ${meses[mes - 1] ?? ''} - ${anio}`;
      }
    }
    return dateStr;
  }

  /** Formato "13 JULIO" (día + mes en mayúsculas, sin año) para el ticket adhesivo. */
  private formatFechaEtiqueta(dateStr?: string): string {
    if (!dateStr) return '';
    const meses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const partes = dateStr.replace(/-/g, '/').split('/');
    if (partes.length === 3) {
      const a = Number(partes[0]), b = Number(partes[1]), c = Number(partes[2]);
      if (!isNaN(a) && !isNaN(b) && !isNaN(c)) {
        const [dia, mes] = a > 31 ? [c, b] : [a, b];
        return `${dia} ${meses[mes - 1] ?? ''}`;
      }
    }
    return dateStr;
  }

  private formatFechaLarga(dateStr?: string): string {
    if (!dateStr) return '';
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const partes = dateStr.replace(/-/g, '/').split('/');
    if (partes.length === 3) {
      const a = Number(partes[0]), b = Number(partes[1]), c = Number(partes[2]);
      if (!isNaN(a) && !isNaN(b) && !isNaN(c)) {
        const [dia, mes, anio] = a > 31 ? [c, b, a] : [a, b, c];
        return `${dia} de ${meses[(mes - 1)] ?? ''} de ${anio}`;
      }
    }
    return dateStr;
  }

  private formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
