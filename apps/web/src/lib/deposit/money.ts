/**
 * Formats a BRL amount that the backend sends as a decimal string (e.g.
 * "1234.56") into pt-BR currency ("R$ 1.234,56"). Returns null when the value
 * is absent or not a finite number, so callers can simply omit the UI.
 *
 * We only parse the string to format it for display — never to compute totals
 * or percentages (the backend sends every amount it wants shown).
 */
export function formatBrlDecimal(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
