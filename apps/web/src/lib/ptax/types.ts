import type {
  PtaxConvertCurrency,
  PtaxPeriod,
  PtaxUiCurrency,
} from "./constants";

export type PtaxDisplaySide = "buy" | "sell";
export type PtaxDirection = "up" | "down" | "flat";

export interface PtaxPreviousClose {
  date: string;
  value: string;
}

export interface PtaxLatestItem {
  currency: PtaxUiCurrency;
  pair: string;
  side: PtaxDisplaySide;
  value: string;
  buy: string;
  sell: string;
  type: string;
  provisional: boolean;
  bulletinAt: string;
  bulletinDate: string;
  previousClose: PtaxPreviousClose | null;
  change: string | null;
  changePct: string | null;
  direction: PtaxDirection;
  isStale: boolean;
  asOf: string;
  source: string;
}

export interface PtaxLatestResponse {
  side: PtaxDisplaySide;
  source: string;
  asOf: string | null;
  isStale: boolean;
  rates: Partial<Record<PtaxUiCurrency, PtaxLatestItem | null>>;
}

export interface PtaxSeriesPoint {
  date: string;
  timestamp: string;
  value: string;
  buy: string;
  sell: string;
  type: string;
  provisional: boolean;
}

export interface PtaxSeriesStats {
  min: string | null;
  max: string | null;
  avg: string | null;
  open: string | null;
  close: string | null;
  periodChange: string | null;
  periodChangePct: string | null;
}

export interface PtaxHistoryResponse {
  currency: PtaxUiCurrency;
  pair: string;
  period: PtaxPeriod;
  side: PtaxDisplaySide;
  source: string;
  asOf: string | null;
  isStale: boolean;
  points: PtaxSeriesPoint[];
  stats: PtaxSeriesStats;
  count: number;
}

export interface PtaxMonthlyAverageEntry {
  month: string;
  average: string;
  businessDays: number;
  isPartial: boolean;
}

export interface PtaxMonthlyAverageResponse {
  currency: PtaxUiCurrency;
  pair: string;
  side: PtaxDisplaySide;
  months: PtaxMonthlyAverageEntry[];
  average12m: string | null;
  latestVsAveragePct: string | null;
  method: string;
  asOf: string | null;
  isStale: boolean;
  source: string;
}

export interface PtaxConvertResponse {
  from: PtaxConvertCurrency;
  to: PtaxConvertCurrency;
  amount: string;
  rate: string;
  result: string;
  side: PtaxDisplaySide;
  bulletinAt: string;
  asOf: string;
  isCross: boolean;
  source: string;
}
