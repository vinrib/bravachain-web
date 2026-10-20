/**
 * Statement row category (new in PR #56; optional until it ships to prod).
 * Labels in pt/en/es per the product spec. REVERSAL and ADJUSTMENT are neutral:
 * they do NOT count as an inbound/outbound movement (rendered in gray).
 */
export type StatementCategory = "DEPOSIT" | "WITHDRAWAL" | "REVERSAL" | "ADJUSTMENT";

/** Visual/semantic direction of a row. "neutral" = not an entrada/saída. */
export type CategoryDirection = "in" | "out" | "neutral";

/** The app currently selects pt/en; "es" labels are provided for completeness. */
export type CategoryLocale = "pt" | "en" | "es";

const CATEGORIES: readonly StatementCategory[] = [
  "DEPOSIT",
  "WITHDRAWAL",
  "REVERSAL",
  "ADJUSTMENT",
];

const LABELS: Record<CategoryLocale, Record<StatementCategory, string>> = {
  pt: {
    DEPOSIT: "Depósito",
    WITHDRAWAL: "Saque",
    REVERSAL: "Estorno",
    ADJUSTMENT: "Ajuste de conciliação",
  },
  en: {
    DEPOSIT: "Deposit",
    WITHDRAWAL: "Withdrawal",
    REVERSAL: "Reversal",
    ADJUSTMENT: "Reconciliation adjustment",
  },
  es: {
    DEPOSIT: "Depósito",
    WITHDRAWAL: "Retiro",
    REVERSAL: "Reverso",
    ADJUSTMENT: "Ajuste de conciliación",
  },
};

/** Parses a raw value into a known category, or null (unknown/absent). */
export function parseCategory(raw: unknown): StatementCategory | null {
  return typeof raw === "string" && (CATEGORIES as readonly string[]).includes(raw)
    ? (raw as StatementCategory)
    : null;
}

export function categoryLabel(
  category: StatementCategory,
  locale: CategoryLocale = "pt",
): string {
  return LABELS[locale][category];
}

/**
 * Row direction. When `category` is known it decides; otherwise falls back to
 * the legacy `type` (INBOUND/WITHDRAWAL) so pre-PR#56 data still renders.
 */
export function categoryDirection(
  category: StatementCategory | null,
  fallbackType: "INBOUND" | "WITHDRAWAL",
): CategoryDirection {
  switch (category) {
    case "DEPOSIT":
      return "in";
    case "WITHDRAWAL":
      return "out";
    case "REVERSAL":
    case "ADJUSTMENT":
      return "neutral";
    default:
      return fallbackType === "WITHDRAWAL" ? "out" : "in";
  }
}
