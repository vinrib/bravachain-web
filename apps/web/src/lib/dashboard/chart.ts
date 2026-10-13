/**
 * Chart palette + formatters for the financial dashboard.
 * The categorical palette was validated (CVD-safe) with the dataviz skill's
 * script; identity is reinforced with direct labels/legends (contrast relief).
 */
export const CATEGORICAL = [
  "#00b67a",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
] as const;

export const COLOR_USD = "#00b67a";
export const COLOR_EUR = "#6366f1";
export const COLOR_TPV = "#00b67a";
export const COLOR_PARTIAL = "#9ca3af";

/**
 * Formats a period-over-period variation. The backend unit isn't confirmed yet,
 * so a ratio (|v| <= 5, e.g. 0.12) is scaled to percent and a larger number is
 * treated as already-percent. Pending confirmation of the real unit.
 */
export function formatVariation(v: number | null): { text: string; dir: -1 | 0 | 1 } | null {
  if (v === null) return null;
  const pct = Math.abs(v) <= 5 ? v * 100 : v;
  const dir = pct > 0.0001 ? 1 : pct < -0.0001 ? -1 : 0;
  const sign = dir > 0 ? "+" : "";
  const text = `${sign}${pct.toFixed(Number.isInteger(pct) ? 0 : 1)}%`;
  return { text, dir };
}

/** Compact BRL for chart axes/labels (e.g. "R$ 1,2 mi"). */
export function compactBrl(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  }
  return `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

/** R$ per unit of currency, e.g. "5,0421". */
export function formatRate(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}
