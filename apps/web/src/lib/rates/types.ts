/**
 * Types for Cotações (/v1/rates/*). Keys are the real backend fields (confirmed).
 * All decimals arrive as STRING — they are converted only for display (never
 * used in client-side financial math).
 */
export type RatePair = "USD_BRL" | "EUR_BRL";
export type ChangeDirection = "up" | "down" | "stable";
export type HistoryPeriod = "1D" | "1W" | "1M" | "3M" | "1Y";
export type RateSource = "awesomeapi" | "ptax" | "snapshot" | "static";

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
  pair: string;
  /** Rate as a number (parsed from the backend string). */
  rate: number | null;
  change24h: number | null;
  changeDirection: ChangeDirection;
  isFallback: boolean;
  updatedAt: string | null;
  source: RateSource | string | null;
  isIndicative: boolean;
}

export interface LiveRates {
  USD_BRL: LiveRate | null;
  EUR_BRL: LiveRate | null;
}

export interface HistoryPoint {
  /** ISO timestamp. */
  timestamp: string;
  rate: number;
}

export interface HistoryStats {
  min: number | null;
  max: number | null;
  open: number | null;
  avg: number | null;
}

export interface RateHistory {
  pair: string;
  period: string;
  points: HistoryPoint[];
  stats: HistoryStats;
  /** True when the backend returned all-zero stats (no data collected yet). */
  empty: boolean;
}

export interface ConvertResult {
  inputAmount: number;
  inputCurrency: string;
  outputAmount: number | null;
  outputCurrency: string;
  rate: number | null;
  updatedAt: string | null;
}

export type AlertCondition = "ABOVE_OR_EQUAL" | "BELOW_OR_EQUAL";
export type AlertStatus = "ACTIVE" | "PAUSED";
export type AlertChannel = "EMAIL" | "WHATSAPP" | "PUSH";

export interface RateAlert {
  id: string;
  pair: string;
  condition: AlertCondition;
  targetRate: number;
  channels: AlertChannel[];
  status: AlertStatus | string;
  triggerCount: number;
  lastTriggeredAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** Distance to target, in percent. */
  distance: number | null;
  distanceDirection: "above" | "below" | null;
}
