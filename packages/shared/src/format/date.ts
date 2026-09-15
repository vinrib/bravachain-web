/** Date/time formatting helpers, defaulting to pt-BR. */

export function formatDate(
  value: string | number | Date,
  locale = "pt-BR",
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(
  value: string | number | Date,
  locale = "pt-BR",
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
