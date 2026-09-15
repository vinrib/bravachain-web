/**
 * Money formatting. Amounts are handled as integer minor units (centavos)
 * to avoid floating-point drift — the same convention the backend uses for
 * balances. Convert to a display string only at the edge.
 */

export interface MoneyFormatOptions {
  /** ISO 4217 currency code. Defaults to BRL. */
  currency?: string;
  /** BCP 47 locale. Defaults to pt-BR. */
  locale?: string;
}

/** Formats an integer amount of centavos as a localized currency string. */
export function formatCentavos(
  centavos: number,
  { currency = "BRL", locale = "pt-BR" }: MoneyFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(centavos / 100);
}

/** Formats a decimal (major-unit) amount as a localized currency string. */
export function formatMoney(
  amount: number,
  { currency = "BRL", locale = "pt-BR" }: MoneyFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Parses a user-typed BRL string ("1.234,56", "R$ 50", "50,00") into a decimal
 * number in major units (reais). Returns null when the input is not a number.
 * The backend carries money as decimals (BRL/BRLA), not centavos.
 */
export function parseBRL(input: string): number | null {
  const cleaned = input
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (cleaned === "" || Number.isNaN(Number(cleaned))) return null;
  return Number(cleaned);
}

/** As {@link parseBRL} but returns integer centavos (for centavos-based APIs). */
export function parseBRLToCentavos(input: string): number | null {
  const reais = parseBRL(input);
  return reais === null ? null : Math.round(reais * 100);
}
