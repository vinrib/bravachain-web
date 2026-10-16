import type {
  AlertChannel,
  ChangeDirection,
  ConvertResult,
  HistoryPoint,
  LiveRate,
  LiveRates,
  RateAlert,
  RateHistory,
} from "./types";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});

/** Parse a backend decimal (string | number) to number, or null. For display only. */
function dec(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}
function numN(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strN = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const bool = (v: unknown): boolean => v === true;

function direction(v: unknown): ChangeDirection {
  return v === "up" || v === "down" ? v : "stable";
}

function normalizeLiveRate(raw: unknown): LiveRate | null {
  if (!raw || typeof raw !== "object") return null;
  const r = obj(raw);
  return {
    pair: str(r.pair),
    rate: dec(r.rate),
    change24h: numN(r.change24h),
    changeDirection: direction(r.changeDirection),
    isFallback: bool(r.isFallback),
    updatedAt: strN(r.updatedAt),
    source: strN(r.source),
    isIndicative: bool(r.isIndicative),
  };
}

export function normalizeLive(raw: unknown): LiveRates {
  const r = obj(raw);
  return {
    USD_BRL: normalizeLiveRate(r.USD_BRL),
    EUR_BRL: normalizeLiveRate(r.EUR_BRL),
  };
}

export function normalizeHistory(raw: unknown): RateHistory {
  const r = obj(raw);
  const points: HistoryPoint[] = arr(r.dataPoints)
    .map((item) => {
      const p = obj(item);
      return { timestamp: str(p.timestamp), rate: dec(p.rate) ?? 0 };
    })
    .filter((p) => p.rate > 0);
  const s = obj(r.stats);
  const min = dec(s.min);
  const max = dec(s.max);
  const open = dec(s.open);
  const avg = dec(s.avg);
  // Backend returns "0" for every stat when no data has been collected yet.
  const empty = points.length < 2 && !min && !max && !avg;
  return {
    pair: str(r.pair),
    period: str(r.period),
    points,
    stats: { min, max, open, avg },
    empty,
  };
}

export function normalizeConvert(raw: unknown): ConvertResult {
  const r = obj(raw);
  return {
    inputAmount: dec(r.inputAmount) ?? 0,
    inputCurrency: str(r.inputCurrency),
    outputAmount: dec(r.outputAmount),
    outputCurrency: str(r.outputCurrency),
    rate: dec(r.rate),
    updatedAt: strN(r.updatedAt),
  };
}

function channels(v: unknown): AlertChannel[] {
  const list = arr(v)
    .map((c) => String(c))
    .filter((c): c is AlertChannel => c === "EMAIL" || c === "WHATSAPP" || c === "PUSH");
  return list.length ? list : ["EMAIL"];
}

export function normalizeAlert(raw: unknown): RateAlert {
  const r = obj(raw);
  const dir = r.distanceDirection;
  return {
    id: str(r.id),
    pair: str(r.pair),
    condition: r.condition === "BELOW_OR_EQUAL" ? "BELOW_OR_EQUAL" : "ABOVE_OR_EQUAL",
    targetRate: dec(r.targetRate) ?? 0,
    channels: channels(r.channels),
    status: r.status === "PAUSED" ? "PAUSED" : r.status === "ACTIVE" ? "ACTIVE" : str(r.status),
    triggerCount: numN(r.triggerCount) ?? 0,
    lastTriggeredAt: strN(r.lastTriggeredAt),
    createdAt: strN(r.createdAt),
    updatedAt: strN(r.updatedAt),
    distance: numN(r.distance),
    distanceDirection: dir === "above" || dir === "below" ? dir : null,
  };
}

export function normalizeAlerts(raw: unknown): RateAlert[] {
  return arr(raw).map(normalizeAlert);
}
