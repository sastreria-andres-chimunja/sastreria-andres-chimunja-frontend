import { stringToDate } from './date.utils';

/** Qué fecha del ítem usa el filtro de fecha de Ítems / Mis ítems. */
export type CampoFechaItem = 'asignado' | 'terminado' | 'entrega';

export const TITULO_CAMPO_FECHA: Record<CampoFechaItem, string> = {
  asignado: 'Fecha de asignación',
  terminado: 'Fecha de terminado',
  entrega: 'Fecha de entrega',
};

/**
 * Filtra ítems por rango de fechas según el campo elegido:
 * - asignado: fechaAsignado ("dd/mm/aaaa").
 * - terminado: fechaTerminado (timestamp) y, como la nómina, sin ítems de
 *   pedidos "No realizado" -- así la lista de terminados de un día muestra
 *   exactamente los mismos ítems que Nómina / Mi nómina para ese día.
 * - entrega: fechaEntrega ("dd/mm/aaaa").
 */
export function filtrarPorFechaDeEstado(
  items: any[],
  campo: CampoFechaItem,
  desde: Date | null,
  hasta: Date | null,
): any[] {
  return items.filter((i) => {
    if (campo === 'terminado' && /no realizado/i.test(i.nombreEstadoPedido ?? '')) return false;
    const f =
      campo === 'terminado' ? (i.fechaTerminado ? new Date(i.fechaTerminado) : null)
      : campo === 'asignado' ? stringToDate(i.fechaAsignado)
      : stringToDate(i.fechaEntrega);
    if (!f) return false;
    if (desde && f < desde) return false;
    if (hasta && f > hasta) return false;
    return true;
  });
}
