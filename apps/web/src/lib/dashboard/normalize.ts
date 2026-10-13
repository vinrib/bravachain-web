import type {
  DashboardData,
  DashboardSummary,
  RailSlice,
  RatePoint,
  TpvPoint,
} from "./types";

/**
 * Maps GET /v1/dashboard/financial (confirmed keys). Decimal-as-string is
 * coerced; absent values stay null. Rates of 0 mean "no data that month" and
 * become null so they aren't plotted.
 */

type Obj = Record<string, unknown>;

function asObj(v: unknown): Obj {
  return v && typeof v === "object" ? (v as Obj) : {};
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

function strN(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeSummary(raw: unknown): DashboardSummary {
  const s = asObj(raw);
  const period = asObj(s.period);
  const tpv = asObj(s.tpv);
  const avgRate = asObj(s.avgRate);
  const revenue = asObj(s.bravaChainRevenue);
  const withdrawals = asObj(s.withdrawals);
  return {
    tpvBrl: numN(tpv.brlEquiv),
    tpvVariation: numN(tpv.vsLastPeriod),
    avgRateUsd: numN(avgRate.usdBrl),
    avgRateEur: numN(avgRate.eurBrl),
    avgRateVariation: numN(avgRate.vsLastPeriod),
    feesPaid: numN(revenue.total),
    feesPaidVariation: numN(revenue.vsLastPeriod),
    feesAvgPercent: numN(revenue.avgPercent),
    withdrawalsTotal: numN(withdrawals.total),
    withdrawalsCount: numN(withdrawals.count),
    periodStart: strN(period.start),
    periodEnd: strN(period.end),
  };
}

function normalizeTpv(raw: unknown): TpvPoint[] {
  const cur = currentYearMonth();
  return arr(asObj(raw).series).map((item) => {
    const p = asObj(item);
    const month = str(p.month);
    return {
      month,
      label: str(p.label, month),
      value: num(p.brlEquiv),
      partial: month.slice(0, 7) === cur,
    };
  });
}

function normalizeRates(raw: unknown): RatePoint[] {
  return arr(asObj(raw).series).map((item) => {
    const p = asObj(item);
    const month = str(p.month);
    const usd = numN(p.usdBrl);
    const eur = numN(p.eurBrl);
    return {
      month,
      label: str(p.label, month),
      usd: usd === 0 ? null : usd,
      eur: eur === 0 ? null : eur,
    };
  });
}

function normalizeRails(raw: unknown): RailSlice[] {
  return arr(asObj(raw).rails).map((item) => {
    const r = asObj(item);
    return {
      name: str(r.label, str(r.rail)),
      value: num(r.amountBrl),
      percent: numN(r.percentage),
    };
  });
}

export function normalizeDashboard(raw: unknown): DashboardData {
  const o = asObj(raw);
  return {
    summary: normalizeSummary(o.summary),
    tpv: normalizeTpv(o.tpv),
    rails: normalizeRails(o.rails),
    rates: normalizeRates(o.rates),
  };
}
