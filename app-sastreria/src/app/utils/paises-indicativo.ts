export interface PaisIndicativo {
  indicativo: string;
  nombre: string;
  bandera: string;
}

/** Colombia primero (la inmensa mayoría de los clientes/empleados), luego
 * los destinos más comunes para la diáspora colombiana (EE. UU., España). */
export const PAISES_INDICATIVO: PaisIndicativo[] = [
  { indicativo: '57',  nombre: 'Colombia',      bandera: '🇨🇴' },
  { indicativo: '1',   nombre: 'Estados Unidos', bandera: '🇺🇸' },
  { indicativo: '34',  nombre: 'España',        bandera: '🇪🇸' },
  { indicativo: '52',  nombre: 'México',        bandera: '🇲🇽' },
  { indicativo: '58',  nombre: 'Venezuela',     bandera: '🇻🇪' },
  { indicativo: '593', nombre: 'Ecuador',       bandera: '🇪🇨' },
  { indicativo: '51',  nombre: 'Perú',          bandera: '🇵🇪' },
  { indicativo: '507', nombre: 'Panamá',        bandera: '🇵🇦' },
  { indicativo: '56',  nombre: 'Chile',         bandera: '🇨🇱' },
  { indicativo: '54',  nombre: 'Argentina',     bandera: '🇦🇷' },
];

/**
 * Separa un teléfono ya guardado (solo dígitos, con o sin indicativo
 * concatenado) en { indicativo, local } para precargar el selector +
 * input al editar un cliente/empleado existente.
 * - 10 dígitos o menos: número "viejo" (guardado antes del selector de
 *   indicativo) -- se asume Colombia, tal cual ya se hacía en el resto
 *   del sistema (ver telefonoConIndicativo() en utils/telefono.utils.ts).
 * - Más de 10 dígitos: se busca cuál indicativo conocido calza como
 *   prefijo (el más largo que calce, para no confundir "1" con "58" por
 *   ejemplo), dejando un resto de 6 a 11 dígitos como número local. Si no
 *   calza ninguno, se deja todo como número local bajo Colombia -- mejor
 *   que perder dígitos adivinando mal.
 */
export function parsearTelefonoGuardado(telefonoGuardado?: string | null): { indicativo: string; local: string } {
  const tel = (telefonoGuardado ?? '').replace(/\D/g, '');
  if (!tel) return { indicativo: '57', local: '' };
  if (tel.length <= 10) return { indicativo: '57', local: tel };

  const porLargo = [...PAISES_INDICATIVO].sort((a, b) => b.indicativo.length - a.indicativo.length);
  for (const p of porLargo) {
    if (tel.startsWith(p.indicativo)) {
      const resto = tel.slice(p.indicativo.length);
      if (resto.length >= 6 && resto.length <= 11) {
        return { indicativo: p.indicativo, local: resto };
      }
    }
  }
  return { indicativo: '57', local: tel };
}
