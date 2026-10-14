import type { StatementRow } from "./types";

/** Foreign-currency symbol for the Moeda column (falls back to the code). */
const SYMBOL: Record<string, string> = { USD: "US$", EUR: "€", GBP: "£" };

export function formatForeign(row: StatementRow): string {
  if (row.amountForeign === null || !row.foreignCurrency) return "—";
  const sym = SYMBOL[row.foreignCurrency] ?? `${row.foreignCurrency} `;
  return `${sym} ${row.amountForeign.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Initials for the counterparty avatar (max two letters). */
export function initials(text: string): string {
  const parts = (text || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase() || "—";
}

/**
 * The display title + secondary line for a row, honoring the rules:
 * - Withdrawal → title "Saque PIX", destination (counterparty) on its own line.
 * - Never surface a backend `description` that mentions "bruto" or "taxa".
 */
export function rowTitle(row: StatementRow): { title: string; sub: string | null } {
  if (row.type === "WITHDRAWAL") {
    return { title: "Saque PIX", sub: row.counterparty };
  }
  const desc = row.description ?? "";
  const hasInternal = /bruto|taxa/i.test(desc);
  const title = row.counterparty || (hasInternal ? "Recebimento" : desc || "Recebimento");
  return { title, sub: null };
}

/** pt-BR date + time (comma decimals handled elsewhere). */
export function formatRowDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  return {
    date: d.toLocaleDateString("pt-BR"),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}
