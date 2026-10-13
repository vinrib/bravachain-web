import type {
  DashboardSummary,
  TpvPoint,
  RailSlice,
  RatePoint,
} from "./types";

/**
 * Defensive mapping for the (untyped) dashboard responses. Each field reads a
 * few plausible key aliases; whatever isn't found stays null/absent (never
 * invented). The exact backend keys are pending confirmation — the aliases
 * tried are documented per field so they can be pinned once confirmed.
 */

type Obj = Record<string, unknown>;

function asObj(v: unknown): Obj {
  return v && typeof v === "object" ? (v as Obj) : {};
}

/** Unwrap a common { data: ... } envelope. */
function unwrap(v: unknown): Obj {
  const o = asObj(v);
  return "data" in o ? asObj(o.data) : o;
}

function pick(o: Obj, ...keys: string[]): unknown {
  for (const k of keys) {
    if (o[k] !== undefined && o[k] !== null) return o[k];
  }
  return undefined;
}

function numN(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}

function num(v: unknown): number {
  return numN(v) ?? 0;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function bool(v: unknown): boolean {
  return v === true || v === "true";
}

// ── summary ───────────────────────────────────────────────────────────────
export function normalizeSummary(raw: unknown): DashboardSummary {
  const s = unwrap(raw);
  return {
    tpv: numN(pick(s, "tpv", "tpvBrl", "volumeBrl", "totalReceivedBrl", "volume")),
    tpvVariation: numN(pick(s, "tpvVariation", "tpvVar", "volumeVariation")),
    avgRateUsd: numN(pick(s, "avgRateUsd", "averageRateUsd", "rateUsd", "usd")),
    avgRateUsdVariation: numN(pick(s, "avgRateUsdVariation", "rateUsdVariation", "usdVar")),
    avgRateEur: numN(pick(s, "avgRateEur", "averageRateEur", "rateEur", "eur")),
    avgRateEurVariation: numN(pick(s, "avgRateEurVariation", "rateEurVariation", "eurVar")),
    feesPaid: numN(pick(s, "feesPaid", "feesPaidBrl", "bravachainFees", "feesBrl")),
    feesPaidVariation: numN(pick(s, "feesPaidVariation", "feesVariation", "feesVar")),
    withdrawals: numN(pick(s, "withdrawals", "withdrawalsBrl", "totalWithdrawnBrl", "withdrawnBrl")),
    withdrawalsVariation: numN(pick(s, "withdrawalsVariation", "withdrawalsVar")),
    periodStart: typeof pick(s, "periodStart", "startDate") === "string" ? str(pick(s, "periodStart", "startDate")) : null,
    periodEnd: typeof pick(s, "periodEnd", "endDate") === "string" ? str(pick(s, "periodEnd", "endDate")) : null,
  };
}

// ── tpv (monthly volume) ────────────────────────────────────────────────────
export function normalizeTpv(raw: unknown): TpvPoint[] {
  const o = unwrap(raw);
  const list = arr(pick(o, "months", "series", "data", "points", "items")) ;
  return (Array.isArray(raw) ? raw : list).map((item) => {
    const p = asObj(item);
    return {
      month: str(pick(p, "month", "ym", "period", "date")),
      label: str(pick(p, "label", "month", "ym")),
      value: num(pick(p, "value", "tpv", "volumeBrl", "amountBrl", "valueBrl", "volume")),
      partial: bool(pick(p, "partial", "isPartial", "incomplete")),
    };
  });
}

// ── rails (volume by receiving method) ──────────────────────────────────────
export function normalizeRails(raw: unknown): RailSlice[] {
  const o = unwrap(raw);
  const list = arr(pick(o, "rails", "series", "data", "breakdown", "items"));
  return (Array.isArray(raw) ? raw : list).map((item) => {
    const r = asObj(item);
    return {
      name: str(pick(r, "name", "rail", "method", "label", "methodLabel")),
      value: num(pick(r, "value", "amountBrl", "valueBrl", "volumeBrl")),
      percent: numN(pick(r, "percent", "pct", "share", "participation")),
    };
  });
}

// ── rates (monthly avg FX) ──────────────────────────────────────────────────
export function normalizeRates(raw: unknown): RatePoint[] {
  const o = unwrap(raw);
  const list = arr(pick(o, "months", "series", "data", "points", "items"));
  return (Array.isArray(raw) ? raw : list).map((item) => {
    const p = asObj(item);
    return {
      month: str(pick(p, "month", "ym", "period", "date")),
      label: str(pick(p, "label", "month", "ym")),
      usd: numN(pick(p, "usd", "rateUsd", "avgRateUsd")),
      eur: numN(pick(p, "eur", "rateEur", "avgRateEur")),
    };
  });
}
