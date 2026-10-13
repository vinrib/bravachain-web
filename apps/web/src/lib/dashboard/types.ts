/**
 * View model for the financial dashboard, mapped from the single endpoint
 * GET /v1/dashboard/financial?period=... (keys confirmed against the backend).
 * Decimal values arrive as strings and are coerced. Variations (`vsLastPeriod`)
 * are already PERCENT numbers (12 = 12%); the sentinel 100 means "new" (prior
 * period was 0). Nothing is invented — absent values stay null.
 */
export type DashboardPeriod = "30d" | "90d" | "12m" | "ytd";

export const PERIODS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "12m", label: "12 meses" },
  { value: "ytd", label: "No ano" },
];

export interface DashboardSummary {
  /** Volume recebido (TPV) em BRL equivalente. */
  tpvBrl: number | null;
  tpvVariation: number | null;
  /** Taxa média de câmbio (R$ por unidade). */
  avgRateUsd: number | null;
  avgRateEur: number | null;
  avgRateVariation: number | null;
  /** Taxas pagas à Bravachain (nunca "receita"), em BRL. */
  feesPaid: number | null;
  feesPaidVariation: number | null;
  feesAvgPercent: number | null;
  /** Saques realizados. */
  withdrawalsTotal: number | null;
  withdrawalsCount: number | null;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface TpvPoint {
  month: string;
  label: string;
  value: number;
  /** True when this is the current (in-progress) calendar month. */
  partial: boolean;
}

export interface RailSlice {
  name: string;
  value: number;
  /** Already a percentage from the backend. */
  percent: number | null;
}

export interface RatePoint {
  month: string;
  label: string;
  /** null for months with no data (backend sends 0 → not plotted). */
  usd: number | null;
  eur: number | null;
}

export interface DashboardData {
  summary: DashboardSummary;
  tpv: TpvPoint[];
  rails: RailSlice[];
  rates: RatePoint[];
}
