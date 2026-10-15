/**
 * Types for Cotações (/v1/rates/*). Responses are NOT typed in the committed
 * openapi.json, so these mirror the backend fields from the product spec; the
 * normalizers map them defensively. Nothing is invented — absent values stay
 * null/absent.
 */
export type RatePair = "USD_BRL" | "EUR_BRL";
export type ChangeDirection = "up" | "down" | "stable";
export type HistoryPeriod = "1D" | "1W" | "1M" | "3M" | "1Y";

export const PAIRS: Array<{ value: RatePair; label: string; currency: string }> = [
  { value: "USD_BRL", label: "USD/BRL", currency: "USD" },
  { value: "EUR_BRL", label: "EUR/BRL", currency: "EUR" },
];

export const PERIODS: Array<{ value: HistoryPeriod; label: string }> = [
  { value: "1D", label: "1D" },
  { value: "1W", label: "7D" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "1Y", label: "1A" },
];

export interface LiveRate {
  rate: number | null;
  change24h: number | null;
  changeDirection: ChangeDirection;
  updatedAt: string | null;
  isFallback: boolean;
  /** "live" | "static" | ... — "static" is treated as unavailable. */
  source: string | null;
}

export interface LiveRates {
  USD_BRL: LiveRate | null;
  EUR_BRL: LiveRate | null;
}

export interface HistoryPoint {
  /** ISO date/time. */
  date: string;
  rate: number;
}

export interface HistoryStats {
  min: number | null;
  max: number | null;
  avg: number | null;
}

export interface RateHistory {
  pair: string;
  period: string;
  points: HistoryPoint[];
  stats: HistoryStats;
}

export interface ConvertResult {
  pair: string;
  amount: number;
  /** Result in BRL. */
  result: number | null;
  rate: number | null;
}

export type AlertCondition = "ABOVE_OR_EQUAL" | "BELOW_OR_EQUAL";
export type AlertStatus = "ACTIVE" | "PAUSED";

export interface RateAlert {
  id: string;
  pair: string;
  condition: AlertCondition;
  targetRate: number;
  status: AlertStatus;
  channels: string[];
  /** Distance to target, only if the API returns it. */
  distance: number | null;
}
