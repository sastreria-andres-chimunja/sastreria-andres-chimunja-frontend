/** Convierte un objeto Date a string "dd/mm/yyyy" para enviar a la API. */
export function dateToString(date: Date | null | undefined): string {
  if (!date) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/** Parsea un string "dd/mm/yyyy" (recibido de la API) a un objeto Date. */
export function stringToDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}
