/**
 * Limpia un teléfono a solo dígitos y le antepone el indicativo de país
 * SOLO si hace falta -- desde que se agregó el selector de indicativo en
 * crear-cliente/crear-empleado, los números nuevos ya se guardan CON
 * indicativo concatenado (p. ej. "573001234567"). Los números viejos
 * (guardados antes de ese cambio) no lo tienen, y un celular colombiano
 * sin indicativo siempre tiene exactamente 10 dígitos -- por eso "más de
 * 10 dígitos" se toma como señal de que el indicativo ya está incluido, y
 * si no, se antepone "57" como se hacía siempre (mismo comportamiento de
 * antes para todo el histórico ya guardado, sin necesidad de migrar nada).
 */
export function telefonoConIndicativo(telefono?: string | null): string {
  const tel = (telefono ?? '').replace(/\D/g, '');
  if (!tel) return '';
  return tel.length > 10 ? tel : `57${tel}`;
}
