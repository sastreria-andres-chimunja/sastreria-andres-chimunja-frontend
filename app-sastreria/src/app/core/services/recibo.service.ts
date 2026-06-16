import { Injectable } from '@angular/core';

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
  negocio?: string;
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

  // ─── RECIBO CLIENTE ───────────────────────────────────────────────────────────

  generarHtmlTermico(data: ReciboData): string {
    const saldo = data.valorTotalPedido - data.totalPagadoPedido;
    const negocio = data.negocio ?? 'Sastrería Andrés Chimunja';
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recibo de pago</title>
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
    .abono-row { font-size: 12px; font-weight: bold; }
    .saldo { font-size: 12px; font-weight: bold; color: ${saldo > 0 ? '#b00' : '#060'}; }
    @media print {
      body { width: 58mm; }
      @page { margin: 0; size: 58mm auto; }
    }
  </style>
</head>
<body>
  <div class="center bold title">${negocio}</div>
  <div class="center sub">Recibo de Pago</div>
  <div class="center sub">${data.fechaPago}</div>
  <div class="line"></div>
  <div class="row"><span>Pedido #:</span><span>${data.idPedido}</span></div>
  <div class="row"><span>Cliente:</span><span>${data.nombreCliente}</span></div>
  <div class="line"></div>
  <div class="row"><span>Total del pedido:</span><span>${this.formatCOP(data.valorTotalPedido)}</span></div>
  <div class="row abono-row"><span>Abono:</span><span>+ ${this.formatCOP(data.valorAbono)}</span></div>
  ${data.metodoPago ? `<div class="row sub"><span>Método:</span><span>${data.metodoPago}</span></div>` : ''}
  <div class="line"></div>
  <div class="row saldo">
    <span>${saldo > 0 ? 'Saldo restante:' : 'PAGADO COMPLETO'}</span>
    <span>${saldo > 0 ? this.formatCOP(saldo) : '✓'}</span>
  </div>
  <div class="line"></div>
  <div class="center sub">¡Gracias por su preferencia!</div>
</body>
</html>`;
  }

  imprimir(data: ReciboData): void {
    const html = this.generarHtmlTermico(data);
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
    const saldo = data.valorTotalPedido - data.totalPagadoPedido;
    const negocio = data.negocio ?? 'Sastrería Andrés Chimunja';
    const lineas = [
      `🧵 *${negocio}*`,
      `📋 *Recibo de Pago* — ${data.fechaPago}`,
      ``,
      `📦 Pedido #${data.idPedido}`,
      `👤 Cliente: ${data.nombreCliente}`,
      ``,
      `💰 Total del pedido: ${this.formatCOP(data.valorTotalPedido)}`,
      `✅ Abono: ${this.formatCOP(data.valorAbono)}`,
      data.metodoPago ? `💳 Método: ${data.metodoPago}` : '',
      ``,
      saldo > 0
        ? `⚠️ Saldo restante: ${this.formatCOP(saldo)}`
        : `🎉 ¡Pedido pagado completamente!`,
    ].filter(Boolean);
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

  imprimirNomina(data: ReciboNominaData): void {
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

  generarTextoWhatsAppNomina(data: ReciboNominaData): string {
    const negocio = data.negocio ?? 'Sastrería Andrés Chimunja';
    const lineas = [
      `🧵 *${negocio}*`,
      `📋 *Comprobante de Pago Nómina* — ${data.fechaPago}`,
      ``,
      `👷 Empleado: ${data.nombreEmpleado}`,
      `📦 Pedido #${data.idPedido}`,
      `📝 Ítem: ${data.descripcion}`,
      ``,
      `💵 Valor pagado: ${this.formatCOP(data.valor)}`,
      ``,
      `✅ Pago registrado exitosamente`,
    ];
    return lineas.join('\n');
  }

  abrirWhatsAppNomina(data: ReciboNominaData, telefono?: string): void {
    const texto = encodeURIComponent(this.generarTextoWhatsAppNomina(data));
    const tel = (telefono ?? '').replace(/\D/g, '');
    const url = tel
      ? `https://wa.me/57${tel}?text=${texto}`
      : `https://wa.me/?text=${texto}`;
    window.open(url, '_blank');
  }

  private formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
