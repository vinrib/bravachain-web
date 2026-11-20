/**
 * Pure formatting helpers for the admin screens. No i18n here — human labels for
 * enums live in the locale files and are resolved in the components.
 */

/** pt-BR date-time, e.g. "27/10/2026 09:12". Empty string for null/invalid. */
export function formatDateTimeBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** pt-BR date, e.g. "27/10/2026". Empty string for null/invalid. */
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
