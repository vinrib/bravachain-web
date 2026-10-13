/**
 * Internal view model for the financial dashboard. The backend responses for
 * /v1/dashboard/financial* are NOT typed in the committed openapi.json, so the
 * normalizer maps the real keys defensively (several plausible aliases) and the
 * exact keys are pending confirmation — see apps/web/src/lib/dashboard/normalize.ts.
 * Nothing is invented: a value that isn't present stays null/absent.
 */
export type DashboardPeriod = "30d" | "90d" | "12m" | "ytd";

export const PERIODS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "12m", label: "12 meses" },
  { value: "ytd", label: "No ano" },
];

export interface DashboardSummary {
  /** Volume recebido (TPV), in BRL. */
  tpv: number | null;
  tpvVariation: number | null;
  /** Taxa média de câmbio aplicada (R$ por unidade). */
  avgRateUsd: number | null;
  avgRateUsdVariation: number | null;
  avgRateEur: number | null;
  avgRateEurVariation: number | null;
  /** Taxas pagas à Bravachain (never "receita"), in BRL. */
  feesPaid: number | null;
  feesPaidVariation: number | null;
  /** Saques realizados, in BRL. */
  withdrawals: number | null;
  withdrawalsVariation: number | null;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface TpvPoint {
  month: string;
  label: string;
  value: number;
  /** Last month of the range may be partial. */
  partial: boolean;
}

export interface RailSlice {
  name: string;
  value: number;
  percent: number | null;
}

export interface RatePoint {
  month: string;
  label: string;
  usd: number | null;
  eur: number | null;
}
