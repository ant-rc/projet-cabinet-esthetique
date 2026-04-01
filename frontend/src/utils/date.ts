/**
 * Local-timezone date utilities.
 * Avoids the UTC pitfall of `new Date('YYYY-MM-DD')` and `toISOString()`.
 */

/** Format a Date object as YYYY-MM-DD using local timezone */
export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse a YYYY-MM-DD string as a local Date (midnight, no UTC shift) */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Safely format a YYYY-MM-DD string for display using Intl */
export function formatDateDisplay(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('fr-FR', options);
}
