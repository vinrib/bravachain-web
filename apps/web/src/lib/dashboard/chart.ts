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

export type VariationView =
  | { kind: "new" }
  | { kind: "pct"; text: string; dir: -1 | 0 | 1 };

/**
 * Formats a period-over-period variation. `vsLastPeriod` is already a percent
 * (12 = 12%). The backend sends exactly 100 when the previous period was 0 and
 * the current isn't — that means "new", not "+100%".
 */
export function formatVariation(v: number | null): VariationView | null {
  if (v === null) return null;
  if (v === 100) return { kind: "new" };
  const dir = v > 0 ? 1 : v < 0 ? -1 : 0;
  const sign = dir > 0 ? "+" : "";
  const text = `${sign}${v.toFixed(Number.isInteger(v) ? 0 : 1)}%`;
  return { kind: "pct", text, dir };
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
