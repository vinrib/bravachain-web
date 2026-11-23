import {
  PTAX_CONVERT_CURRENCIES,
  PTAX_PERIODS,
  PTAX_UI_CURRENCIES,
  type PtaxConvertCurrency,
  type PtaxPeriod,
  type PtaxUiCurrency,
} from "./constants";
import type {
  PtaxConvertResponse,
  PtaxDirection,
  PtaxDisplaySide,
  PtaxHistoryResponse,
  PtaxLatestItem,
  PtaxLatestResponse,
  PtaxMonthlyAverageEntry,
  PtaxMonthlyAverageResponse,
  PtaxPreviousClose,
  PtaxSeriesPoint,
  PtaxSeriesStats,
} from "./types";

const DECIMAL_STR_RE = /^-?\d+(?:\.\d+)?$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_MONTH_RE = /^\d{4}-\d{2}$/;

export class PtaxValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PtaxValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new PtaxValidationError(`Expected string for ${field}`);
  }
  return value;
}

function assertNullableString(value: unknown, field: string): string | null {
  if (value === null) return null;
  return assertString(value, field);
}

function assertDecimalString(value: unknown, field: string): string {
  const str = assertString(value, field);
  if (!DECIMAL_STR_RE.test(str)) {
    throw new PtaxValidationError(`Expected decimal string for ${field}`);
  }
  return str;
}

function assertNullableDecimalString(
  value: unknown,
  field: string,
): string | null {
  if (value === null) return null;
  return assertDecimalString(value, field);
}

function assertBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new PtaxValidationError(`Expected boolean for ${field}`);
  }
  return value;
}

function assertNonNegativeInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new PtaxValidationError(`Expected non-negative integer for ${field}`);
  }
  return value;
}

function assertSide(value: unknown, field: string): PtaxDisplaySide {
  if (value !== "buy" && value !== "sell") {
    throw new PtaxValidationError(`Invalid side for ${field}`);
  }
  return value;
}

function assertDirection(value: unknown, field: string): PtaxDirection {
  if (value !== "up" && value !== "down" && value !== "flat") {
    throw new PtaxValidationError(`Invalid direction for ${field}`);
  }
  return value;
}

function assertUiCurrency(value: unknown, field: string): PtaxUiCurrency {
  if (
    typeof value !== "string" ||
    !(PTAX_UI_CURRENCIES as readonly string[]).includes(value)
  ) {
    throw new PtaxValidationError(`Invalid currency for ${field}`);
  }
  return value as PtaxUiCurrency;
}

function assertConvertCurrency(
  value: unknown,
  field: string,
): PtaxConvertCurrency {
  if (
    typeof value !== "string" ||
    !(PTAX_CONVERT_CURRENCIES as readonly string[]).includes(value)
  ) {
    throw new PtaxValidationError(`Invalid convert currency for ${field}`);
  }
  return value as PtaxConvertCurrency;
}

function assertPeriod(value: unknown, field: string): PtaxPeriod {
  if (
    typeof value !== "string" ||
    !(PTAX_PERIODS as readonly string[]).includes(value)
  ) {
    throw new PtaxValidationError(`Invalid period for ${field}`);
  }
  return value as PtaxPeriod;
}

function assertIsoDate(value: unknown, field: string): string {
  const str = assertString(value, field);
  if (!ISO_DATE_RE.test(str)) {
    throw new PtaxValidationError(`Invalid ISO date for ${field}`);
  }
  return str;
}

function assertIsoTimestamp(value: unknown, field: string): string {
  const str = assertString(value, field);
  if (Number.isNaN(Date.parse(str))) {
    throw new PtaxValidationError(`Invalid ISO timestamp for ${field}`);
  }
  return str;
}

function parsePreviousClose(
  value: unknown,
  field: string,
): PtaxPreviousClose | null {
  if (value === null) return null;
  if (!isRecord(value)) {
    throw new PtaxValidationError(`Expected object or null for ${field}`);
  }
  return {
    date: assertIsoDate(value.date, `${field}.date`),
    value: assertDecimalString(value.value, `${field}.value`),
  };
}

function parseLatestItem(value: unknown, field: string): PtaxLatestItem {
  if (!isRecord(value)) {
    throw new PtaxValidationError(`Expected object for ${field}`);
  }
  return {
    currency: assertUiCurrency(value.currency, `${field}.currency`),
    pair: assertString(value.pair, `${field}.pair`),
    side: assertSide(value.side, `${field}.side`),
    value: assertDecimalString(value.value, `${field}.value`),
    buy: assertDecimalString(value.buy, `${field}.buy`),
    sell: assertDecimalString(value.sell, `${field}.sell`),
    type: assertString(value.type, `${field}.type`),
    provisional: assertBoolean(value.provisional, `${field}.provisional`),
    bulletinAt: assertIsoTimestamp(value.bulletinAt, `${field}.bulletinAt`),
    bulletinDate: assertIsoDate(value.bulletinDate, `${field}.bulletinDate`),
    previousClose: parsePreviousClose(
      value.previousClose,
      `${field}.previousClose`,
    ),
    change: assertNullableDecimalString(value.change, `${field}.change`),
    changePct: assertNullableDecimalString(
      value.changePct,
      `${field}.changePct`,
    ),
    direction: assertDirection(value.direction, `${field}.direction`),
    isStale: assertBoolean(value.isStale, `${field}.isStale`),
    asOf: assertIsoTimestamp(value.asOf, `${field}.asOf`),
    source: assertString(value.source, `${field}.source`),
  };
}

export function parsePtaxLatestResponse(raw: unknown): PtaxLatestResponse {
  if (!isRecord(raw) || !isRecord(raw.rates)) {
    throw new PtaxValidationError("Invalid /v1/ptax/latest payload");
  }
  const rates: Partial<Record<PtaxUiCurrency, PtaxLatestItem | null>> = {};
  for (const [k, v] of Object.entries(raw.rates)) {
    if (!(PTAX_UI_CURRENCIES as readonly string[]).includes(k)) {
      continue;
    }
    const curr = k as PtaxUiCurrency;
    rates[curr] = v === null ? null : parseLatestItem(v, `rates.${curr}`);
  }

  return {
    side: assertSide(raw.side, "side"),
    source: assertString(raw.source, "source"),
    asOf:
      raw.asOf === null ? null : assertIsoTimestamp(raw.asOf, "asOf"),
    isStale: assertBoolean(raw.isStale, "isStale"),
    rates,
  };
}

function parseSeriesPoint(value: unknown, idx: number): PtaxSeriesPoint {
  if (!isRecord(value)) {
    throw new PtaxValidationError(`Expected object for points[${idx}]`);
  }
  return {
    date: assertIsoDate(value.date, `points[${idx}].date`),
    timestamp: assertIsoTimestamp(value.timestamp, `points[${idx}].timestamp`),
    value: assertDecimalString(value.value, `points[${idx}].value`),
    buy: assertDecimalString(value.buy, `points[${idx}].buy`),
    sell: assertDecimalString(value.sell, `points[${idx}].sell`),
    type: assertString(value.type, `points[${idx}].type`),
    provisional: assertBoolean(value.provisional, `points[${idx}].provisional`),
  };
}

function parseSeriesStats(value: unknown): PtaxSeriesStats {
  if (!isRecord(value)) {
    throw new PtaxValidationError("Expected object for stats");
  }
  return {
    min: assertNullableDecimalString(value.min, "stats.min"),
    max: assertNullableDecimalString(value.max, "stats.max"),
    avg: assertNullableDecimalString(value.avg, "stats.avg"),
    open: assertNullableDecimalString(value.open, "stats.open"),
    close: assertNullableDecimalString(value.close, "stats.close"),
    periodChange: assertNullableDecimalString(
      value.periodChange,
      "stats.periodChange",
    ),
    periodChangePct: assertNullableDecimalString(
      value.periodChangePct,
      "stats.periodChangePct",
    ),
  };
}

export function parsePtaxHistoryResponse(raw: unknown): PtaxHistoryResponse {
  if (!isRecord(raw) || !Array.isArray(raw.points)) {
    throw new PtaxValidationError("Invalid /v1/ptax/history payload");
  }
  const points = raw.points.map((p, idx) => parseSeriesPoint(p, idx));
  const count = assertNonNegativeInt(raw.count, "count");
  if (count !== points.length) {
    throw new PtaxValidationError(
      `History count mismatch: count=${count} vs points.length=${points.length}`,
    );
  }
  return {
    currency: assertUiCurrency(raw.currency, "currency"),
    pair: assertString(raw.pair, "pair"),
    period: assertPeriod(raw.period, "period"),
    side: assertSide(raw.side, "side"),
    source: assertString(raw.source, "source"),
    asOf: raw.asOf === null ? null : assertIsoTimestamp(raw.asOf, "asOf"),
    isStale: assertBoolean(raw.isStale, "isStale"),
    points,
    stats: parseSeriesStats(raw.stats),
    count,
  };
}

function parseMonthlyEntry(
  value: unknown,
  idx: number,
): PtaxMonthlyAverageEntry {
  if (!isRecord(value)) {
    throw new PtaxValidationError(`Expected object for months[${idx}]`);
  }
  const month = assertString(value.month, `months[${idx}].month`);
  if (!YEAR_MONTH_RE.test(month)) {
    throw new PtaxValidationError(`Invalid YYYY-MM for months[${idx}].month`);
  }
  return {
    month,
    average: assertDecimalString(value.average, `months[${idx}].average`),
    businessDays: assertNonNegativeInt(
      value.businessDays,
      `months[${idx}].businessDays`,
    ),
    isPartial: assertBoolean(value.isPartial, `months[${idx}].isPartial`),
  };
}

export function parsePtaxMonthlyAverageResponse(
  raw: unknown,
): PtaxMonthlyAverageResponse {
  if (!isRecord(raw) || !Array.isArray(raw.months)) {
    throw new PtaxValidationError("Invalid /v1/ptax/monthly-average payload");
  }
  return {
    currency: assertUiCurrency(raw.currency, "currency"),
    pair: assertString(raw.pair, "pair"),
    side: assertSide(raw.side, "side"),
    months: raw.months.map((m, idx) => parseMonthlyEntry(m, idx)),
    average12m: assertNullableDecimalString(raw.average12m, "average12m"),
    latestVsAveragePct: assertNullableDecimalString(
      raw.latestVsAveragePct,
      "latestVsAveragePct",
    ),
    method: assertString(raw.method, "method"),
    asOf: raw.asOf === null ? null : assertIsoTimestamp(raw.asOf, "asOf"),
    isStale: assertBoolean(raw.isStale, "isStale"),
    source: assertString(raw.source, "source"),
  };
}

export function parsePtaxConvertResponse(raw: unknown): PtaxConvertResponse {
  if (!isRecord(raw)) {
    throw new PtaxValidationError("Invalid /v1/ptax/convert payload");
  }
  return {
    from: assertConvertCurrency(raw.from, "from"),
    to: assertConvertCurrency(raw.to, "to"),
    amount: assertDecimalString(raw.amount, "amount"),
    rate: assertDecimalString(raw.rate, "rate"),
    result: assertDecimalString(raw.result, "result"),
    side: assertSide(raw.side, "side"),
    bulletinAt: assertIsoTimestamp(raw.bulletinAt, "bulletinAt"),
    asOf: assertIsoTimestamp(raw.asOf, "asOf"),
    isCross: assertBoolean(raw.isCross, "isCross"),
    source: assertString(raw.source, "source"),
  };
}

export function isNullableStringValid(value: unknown): string | null {
  return assertNullableString(value, "value");
}
