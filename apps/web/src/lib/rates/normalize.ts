import type {
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

function numN(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}
const num = (v: unknown): number => numN(v) ?? 0;
const strN = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const str = (v: unknown, f = ""): string => (typeof v === "string" ? v : f);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const bool = (v: unknown): boolean => v === true || v === "true";

function pick(o: Obj, ...keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

function direction(v: unknown, change: number | null): ChangeDirection {
  const s = String(v ?? "").toLowerCase();
  if (s === "up" || s === "down" || s === "stable") return s as ChangeDirection;
  if (change === null || change === 0) return "stable";
  return change > 0 ? "up" : "down";
}

function normalizeLiveRate(raw: unknown): LiveRate | null {
  if (!raw || typeof raw !== "object") return null;
  const r = obj(raw);
  const change = numN(pick(r, "change24h", "change", "variation24h"));
  return {
    rate: numN(pick(r, "rate", "value", "price", "mid")),
    change24h: change,
    changeDirection: direction(pick(r, "changeDirection", "direction"), change),
    updatedAt: strN(pick(r, "updatedAt", "timestamp", "at")),
    isFallback: bool(pick(r, "isFallback", "fallback")),
    source: strN(pick(r, "source")),
  };
}

export function normalizeLive(raw: unknown): LiveRates {
  const r = "data" in obj(raw) ? obj(obj(raw).data) : obj(raw);
  return {
    USD_BRL: normalizeLiveRate(pick(r, "USD_BRL", "usdBrl", "USDBRL")),
    EUR_BRL: normalizeLiveRate(pick(r, "EUR_BRL", "eurBrl", "EURBRL")),
  };
}

export function normalizeHistory(raw: unknown): RateHistory {
  const r = "data" in obj(raw) ? obj(obj(raw).data) : obj(raw);
  const list = arr(pick(r, "dataPoints", "points", "series", "history"));
  const points: HistoryPoint[] = list
    .map((item) => {
      const p = obj(item);
      return {
        date: str(pick(p, "date", "timestamp", "time", "at", "label")),
        rate: num(pick(p, "rate", "value", "price", "close", "mid")),
      };
    })
    .filter((p) => p.rate > 0);
  const s = obj(pick(r, "stats"));
  return {
    pair: str(pick(r, "pair")),
    period: str(pick(r, "period")),
    points,
    stats: {
      min: numN(pick(s, "min", "minimum", "low")),
      max: numN(pick(s, "max", "maximum", "high")),
      avg: numN(pick(s, "avg", "average", "mean")),
    },
  };
}

export function normalizeConvert(raw: unknown): ConvertResult {
  const r = "data" in obj(raw) ? obj(obj(raw).data) : obj(raw);
  return {
    pair: str(pick(r, "pair")),
    amount: num(pick(r, "amount", "input")),
    result: numN(pick(r, "result", "resultBrl", "converted", "output", "brl")),
    rate: numN(pick(r, "rate", "appliedRate", "value")),
  };
}

export function normalizeAlert(raw: unknown): RateAlert {
  const r = obj(raw);
  const cond = String(pick(r, "condition", "type") ?? "").toUpperCase();
  const status = String(pick(r, "status") ?? "ACTIVE").toUpperCase();
  const channels = arr(pick(r, "channels")).map((c) => String(c));
  return {
    id: str(pick(r, "id", "_id", "alertId")),
    pair: str(pick(r, "pair")),
    condition: cond === "BELOW_OR_EQUAL" ? "BELOW_OR_EQUAL" : "ABOVE_OR_EQUAL",
    targetRate: num(pick(r, "targetRate", "target", "rate")),
    status: status === "PAUSED" ? "PAUSED" : "ACTIVE",
    channels: channels.length ? channels : ["EMAIL"],
    distance: numN(pick(r, "distance", "distanceToTarget", "remaining")),
  };
}

export function normalizeAlerts(raw: unknown): RateAlert[] {
  const r = raw && typeof raw === "object" && "data" in obj(raw) ? obj(raw).data : raw;
  const list = Array.isArray(r) ? r : arr(pick(obj(r), "alerts", "items"));
  return list.map(normalizeAlert);
}
