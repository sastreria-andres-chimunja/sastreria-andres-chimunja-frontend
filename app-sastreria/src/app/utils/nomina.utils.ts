/**
 * Lo que gana el empleado por un ítem: el valor fijo de comisión si lo tiene
 * (confecciones) o valor × % de comisión (arreglos y el resto). Misma regla
 * que el backend (src/utils/nomina.utils.js).
 */
export function valorEmpleadoItem(item: any): number {
  return item.valorComision != null
    ? Number(item.valorComision)
    : Number(item.valor ?? 0) * Number(item.comisionEmpleado ?? 0) / 100;
}
