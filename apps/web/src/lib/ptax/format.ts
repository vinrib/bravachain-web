import { PTAX_TIME_ZONE, type PtaxPeriod } from "./constants";

const DECIMAL_RE = /^([+-])?(\d+)(?:\.(\d+))?$/;
const CALC_VALID_RE = /^\d{1,15}(?:\.\d{1,6})?$/;

const PT_MONTH_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

/**
 * Pure string-based ROUND_HALF_UP rounding with full carry propagation.
 * Never coerces financial values to JS floating-point numbers.
 */
export function roundDecimalString(raw: string, decimals: number): {
  negative: boolean;
  intPart: string;
  fracPart: string;
  isZero: boolean;
} {
  const match = DECIMAL_RE.exec(raw.trim());
  if (!match) {
    throw new Error(`Invalid decimal string: "${raw}"`);
  }

  const sign = match[1] === "-" ? -1 : 1;
  const rawInt = (match[2] ?? "0").replace(/^0+(?=\d)/, "");
  const rawFrac = match[3] ?? "";

  const paddedFrac = rawFrac.padEnd(decimals + 1, "0");
  const keptFrac = paddedFrac.slice(0, decimals);
  const nextDigit = paddedFrac.charCodeAt(decimals) - 48; // '0' === 48

  const digits = `${rawInt}${keptFrac}`.split("").map((ch) => ch.charCodeAt(0) - 48);

  if (nextDigit >= 5) {
    let carry = 1;
    for (let i = digits.length - 1; i >= 0 && carry > 0; i -= 1) {
      const sum = (digits[i] ?? 0) + carry;
      if (sum >= 10) {
        digits[i] = 0;
        carry = 1;
      } else {
        digits[i] = sum;
        carry = 0;
      }
    }
    if (carry > 0) {
      digits.unshift(1);
    }
  }

  const allStr = digits.join("");
  const intLen = allStr.length - decimals;
  const intPart = intLen > 0 ? allStr.slice(0, intLen) : "0";
  const fracPart =
    decimals > 0
      ? (intLen > 0 ? allStr.slice(intLen) : allStr.padStart(decimals, "0"))
      : "";

  const isZero = /^0+$/.test(intPart) && (fracPart === "" || /^0+$/.test(fracPart));
  return {
    negative: sign < 0 && !isZero,
    intPart,
    fracPart,
    isZero,
  };
}

function addPtBrThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Formats a decimal string from the API into pt-BR with `decimals` fractional digits (default 4). */
export function formatPtaxDecimal(
  raw: string | null | undefined,
  decimals = 4,
): string {
  if (raw === null || raw === undefined) return "—";
  const { negative, intPart, fracPart } = roundDecimalString(raw, decimals);
  const formattedInt = addPtBrThousands(intPart);
  const prefix = negative ? "-" : "";
  return decimals > 0 ? `${prefix}${formattedInt},${fracPart}` : `${prefix}${formattedInt}`;
}

/** Formats a signed daily delta (e.g. "+0,0787", "-0,0616", "0,0000"). */
export function formatPtaxSignedDelta(
  raw: string | null | undefined,
  decimals = 4,
): string {
  if (raw === null || raw === undefined) return "—";
  const { negative, intPart, fracPart, isZero } = roundDecimalString(
    raw,
    decimals,
  );
  const formattedInt = addPtBrThousands(intPart);
  const sign = isZero ? "" : negative ? "-" : "+";
  return decimals > 0 ? `${sign}${formattedInt},${fracPart}` : `${sign}${formattedInt}`;
}

/** Formats a percentage string with 2 decimal places and explicit sign (e.g. "+1,35%", "-1,08%", "0,00%"). */
export function formatPtaxPercent(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return "—";
  return `${formatPtaxSignedDelta(raw, 2)}%`;
}

/**
 * Normalizes calculator input string without float coercion:
 * - Strips leading/trailing whitespace and optional "R$" prefix.
 * - Accepts pt-BR thousands grouping with comma decimal ("1.000,50", "10.000,00")
 *   and pt-BR dot-only thousands ("1.000", "1.500", "1.000.000"), or single decimal dot ("1.5", "1000.50").
 * - Strips leading integer zeros BEFORE enforcing max 15 integer digits and max 6 decimals.
 * - Must be strictly positive (> 0) and match `/^\d{1,15}(\.\d{1,6})?$/`.
 */
export type CalculatorAmountNormalization =
  | { status: "empty" }
  | { status: "valid"; normalized: string }
  | { status: "invalid" };

export function normalizeCalculatorAmount(
  raw: string,
): CalculatorAmountNormalization {
  const cleaned = raw.trim().replace(/^R\$\s*/i, "").trim();
  if (cleaned === "") {
    return { status: "empty" };
  }

  // Reject anything containing whitespace inside, signs, letters, or scientific notation
  if (!/^[0-9.,]+$/.test(cleaned)) {
    return { status: "invalid" };
  }

  let normalized: string;
  if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts.length !== 2) {
      return { status: "invalid" };
    }
    const [intRaw, fracRaw] = parts;
    if (!intRaw || !fracRaw || !/^\d{1,6}$/.test(fracRaw)) {
      return { status: "invalid" };
    }
    if (intRaw.includes(".")) {
      if (!/^\d{1,3}(?:\.\d{3})+$/.test(intRaw)) {
        return { status: "invalid" };
      }
    } else if (!/^\d+$/.test(intRaw)) {
      return { status: "invalid" };
    }
    const intDigits = intRaw.replace(/\./g, "").replace(/^0+(?=\d)/, "");
    normalized = `${intDigits}.${fracRaw}`;
  } else if (cleaned.includes(".")) {
    if (/^\d{1,3}(?:\.\d{3})+$/.test(cleaned)) {
      normalized = cleaned.replace(/\./g, "").replace(/^0+(?=\d)/, "");
    } else if (/^\d+\.\d{1,6}$/.test(cleaned)) {
      const [intRaw, fracRaw] = cleaned.split(".");
      const intDigits = (intRaw ?? "0").replace(/^0+(?=\d)/, "");
      normalized = `${intDigits}.${fracRaw}`;
    } else {
      return { status: "invalid" };
    }
  } else {
    normalized = cleaned.replace(/^0+(?=\d)/, "");
  }

  if (!CALC_VALID_RE.test(normalized)) {
    return { status: "invalid" };
  }

  // Must be strictly greater than zero (at least one non-zero digit)
  if (!/[1-9]/.test(normalized)) {
    return { status: "invalid" };
  }

  return { status: "valid", normalized };
}

/**
 * Converts a decimal string to a JS number EXCLUSIVELY for chart axis scaling
 * and pixel coordinates — never for financial computation or display.
 * Returns `NaN` for non-finite inputs so callers drop invalid points instead of
 * silently plotting 0.
 */
export function toChartScaleNumber(decimalStr: string): number {
  const n = Number(decimalStr);
  return Number.isFinite(n) ? n : Number.NaN;
}

/**
 * Formats a numeric Y-axis tick label safely for presentation only:
 * never throws and never emits scientific notation.
 */
export function formatYAxisTick(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) return "—";
  const safeDecimals = Math.max(0, Math.min(6, Math.trunc(decimals)));
  if (Math.abs(value) < 1e21) {
    const fixed = value.toFixed(safeDecimals);
    const noNegZero = /^-0(?:\.0+)?$/.test(fixed) ? fixed.slice(1) : fixed;
    return noNegZero.replace(".", ",");
  }
  return new Intl.NumberFormat("pt-BR", {
    useGrouping: false,
    minimumFractionDigits: safeDecimals,
    maximumFractionDigits: safeDecimals,
  }).format(value);
}

/**
 * Computes Y-axis [min, max] from numeric point values with 1.5% padding
 * (within the 1–2% target) for visual chart scaling only.
 */
export function computeYAxisDomain(
  values: readonly number[],
): [number, number] {
  const finite = values.filter((v) => Number.isFinite(v));
  const first = finite[0];
  if (first === undefined) {
    return [0, 1];
  }
  let min = first;
  let max = first;
  for (const v of finite) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const span = max - min;
  // 1.5% of span when varying; 1.5% of value (fallback 0.05) when flat / single point
  const pad = span > 0 ? span * 0.015 : Math.max(Math.abs(max) * 0.015, 0.05);
  return [min - pad, max + pad];
}

const MAX_Y_AXIS_TICKS = 8;

function snapNiceStep(rawStep: number, minStep: number): number {
  const candidate = Math.max(rawStep, minStep);
  if (!Number.isFinite(candidate) || candidate <= 0) {
    return Number.NaN;
  }
  const exponent = Math.floor(Math.log10(candidate));
  const power = 10 ** exponent;
  if (!Number.isFinite(power) || power === 0) {
    return Number.NaN;
  }
  const fraction = candidate / power;
  const niceFraction =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * power;
}

function bumpNiceStep(step: number): number {
  const exponent = Math.floor(Math.log10(step));
  const power = 10 ** exponent;
  const fraction = step / power;
  if (fraction < 1.5) return 2 * power;
  if (fraction < 3.5) return 5 * power;
  return 10 * power;
}

function buildFiniteFallbackTicks(min: number, max: number): {
  domain: [number, number];
  ticks: number[];
} {
  const diff = max - min;
  if (Number.isFinite(diff) && diff > 0) {
    const step = diff / 4;
    if (Number.isFinite(step) && step > 0) {
      const ticks = [min, min + step, min + 2 * step, min + 3 * step, max];
      if (ticks.every(Number.isFinite)) {
        return { domain: [min, max], ticks };
      }
    }
  }
  return { domain: [min, max], ticks: min === max ? [min, max] : [min, max] };
}

/**
 * Computes a "nice", equidistant Y-axis tick ladder from numeric point values,
 * for visual chart scaling only (never for financial computation).
 * Guarantees:
 * - Minimum step compatible with `decimals` (4 decimals -> 0.0001) so formatted
 *   tick labels never repeat;
 * - At most 8 ticks;
 * - Finite `step`, `niceMin`, `niceMax` validated before looping;
 * - Centered 3–5 ticks with small proportional padding for constant / 1-point series.
 */
export function computeNiceYAxisTicks(
  values: readonly number[],
  desiredTickCount = 5,
  decimals = 4,
): { domain: [number, number]; ticks: number[] } {
  const finite = values.filter((v) => Number.isFinite(v));
  const first = finite[0];
  if (first === undefined) {
    return { domain: [0, 1], ticks: [0, 1] };
  }

  let min = first;
  let max = first;
  for (const v of finite) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const safeDecimals = Math.max(0, Math.min(6, Math.trunc(decimals)));
  const minStep = 10 ** -safeDecimals;
  const span = max - min;
  if (!Number.isFinite(span)) {
    return buildFiniteFallbackTicks(min, max);
  }

  // Constant or 1-point series: build small centered proportional range (3..5 ticks)
  if (span === 0) {
    const halfSpan = Math.max(Math.abs(max) * 0.01, minStep * 2, 0.01);
    const effMin = min - halfSpan;
    const effMax = max + halfSpan;
    if (!Number.isFinite(effMin) || !Number.isFinite(effMax)) {
      return buildFiniteFallbackTicks(min, max);
    }
    const step = snapNiceStep(
      (effMax - effMin) / Math.max(desiredTickCount - 1, 2),
      minStep,
    );
    if (!Number.isFinite(step) || step <= 0) {
      return buildFiniteFallbackTicks(min, max);
    }
    const center = Math.round(max / step) * step;
    const niceMin = center - 2 * step;
    const niceMax = center + 2 * step;
    if (!Number.isFinite(niceMin) || !Number.isFinite(niceMax)) {
      return buildFiniteFallbackTicks(min, max);
    }
    const roundingDecimals = Math.max(0, -Math.floor(Math.log10(step)) + 2);
    const scale = 10 ** roundingDecimals;
    const round = (n: number) =>
      Number.isFinite(scale) && Math.abs(n) * scale < Number.MAX_SAFE_INTEGER
        ? Math.round(n * scale) / scale
        : n;
    const ticks = [
      round(niceMin),
      round(center - step),
      round(center),
      round(center + step),
      round(niceMax),
    ];
    return { domain: [ticks[0]!, ticks[ticks.length - 1]!], ticks };
  }

  const targetIntervals = Math.max(desiredTickCount - 1, 1);
  let step = snapNiceStep(span / targetIntervals, minStep);
  if (!Number.isFinite(step) || step <= 0) {
    return buildFiniteFallbackTicks(min, max);
  }

  const computeBounds = (s: number) => {
    let lo = Math.floor(min / s) * s;
    let hi = Math.ceil(max / s) * s;
    if (lo >= min) lo -= s;
    if (hi <= max) hi += s;
    return { lo, hi };
  };

  let { lo: niceMin, hi: niceMax } = computeBounds(step);

  // Enforce max 8 ticks by stepping up the 1-2-5 ladder
  let bumpGuard = 0;
  while (
    Number.isFinite(step) &&
    Number.isFinite(niceMin) &&
    Number.isFinite(niceMax) &&
    Math.round((niceMax - niceMin) / step) + 1 > MAX_Y_AXIS_TICKS &&
    bumpGuard < 32
  ) {
    step = bumpNiceStep(step);
    ({ lo: niceMin, hi: niceMax } = computeBounds(step));
    bumpGuard += 1;
  }

  if (
    !Number.isFinite(step) ||
    step <= 0 ||
    !Number.isFinite(niceMin) ||
    !Number.isFinite(niceMax) ||
    !Number.isFinite(niceMax - niceMin)
  ) {
    return buildFiniteFallbackTicks(min, max);
  }

  const roundingDecimals = Math.max(0, -Math.floor(Math.log10(step)) + 2);
  const scale = 10 ** roundingDecimals;
  const round = (n: number) =>
    Number.isFinite(scale) && Math.abs(n) * scale < Number.MAX_SAFE_INTEGER
      ? Math.round(n * scale) / scale
      : n;

  const ticks: number[] = [];
  const tickCount = Math.min(
    MAX_Y_AXIS_TICKS,
    Math.max(2, Math.round((niceMax - niceMin) / step) + 1),
  );
  for (let i = 0; i < tickCount; i += 1) {
    const val = round(niceMin + i * step);
    if (!Number.isFinite(val)) {
      return buildFiniteFallbackTicks(min, max);
    }
    ticks.push(val);
  }

  const domain: [number, number] = [
    ticks[0] ?? niceMin,
    ticks[ticks.length - 1] ?? niceMax,
  ];
  if (domain[0] > min || domain[1] < max) {
    return buildFiniteFallbackTicks(min, max);
  }
  return { domain, ticks };
}

function getBrasiliaParts(isoTimestamp: string): Record<string, string> {
  const date = new Date(isoTimestamp);
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: PTAX_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      parts[part.type] = part.value;
    }
  }
  return parts;
}

/** Formats an ISO timestamp strictly in America/Sao_Paulo as "dd/mm hh:mm". */
export function formatBrasiliaDateTime(isoTimestamp: string): string {
  const p = getBrasiliaParts(isoTimestamp);
  const hour = p.hour === "24" ? "00" : p.hour;
  return `${p.day}/${p.month} ${hour}:${p.minute}`;
}

/** Formats an ISO timestamp strictly in America/Sao_Paulo as "hh:mm". */
export function formatBrasiliaTime(isoTimestamp: string): string {
  const p = getBrasiliaParts(isoTimestamp);
  const hour = p.hour === "24" ? "00" : p.hour;
  return `${hour}:${p.minute}`;
}

/** Formats a YYYY-MM-DD date string directly without timezone drift. */
export function formatIsoDateShort(
  isoDate: string,
  includeYear = false,
): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return includeYear ? `${day}/${month}/${year.slice(-2)}` : `${day}/${month}`;
}

/** Builds X-axis category label for a history point according to period. */
export function formatHistoryPointLabel(
  point: { date: string; timestamp: string },
  period: PtaxPeriod,
): string {
  if (period === "1D") {
    return formatBrasiliaTime(point.timestamp);
  }
  return formatIsoDateShort(point.date, period === "1Y");
}

export interface XAxisTickPlan {
  value: string;
  /** False for a repeated label (e.g. two 1D bulletins in the same minute) — render nothing. */
  show: boolean;
  /** "start"/"end" for the first/last category so the label never overflows past the chart edge. */
  textAnchor: "start" | "middle" | "end";
}

/**
 * Plans X-axis category tick rendering from the already-formatted labels:
 * suppresses a label that repeats the previous visible one (keeps only the
 * first occurrence), and anchors the first/last label inward so neither
 * overflows the chart's left/right edge. Pure and presentation-only.
 */
export function planXAxisTicks(
  labels: readonly string[],
): XAxisTickPlan[] {
  const seen = new Set<string>();
  const lastIndex = labels.length - 1;
  return labels.map((value, index) => {
    const isRepeat = seen.has(value);
    if (!isRepeat) seen.add(value);
    // Only the LAST label is anchored away from center ("end", so it grows
    // leftward and never overflows the right edge). The first label stays
    // "middle" like every other tick — anchoring it "start" too made it grow
    // rightward and collide with the next tick's label (visual review
    // finding on the 1Y chart).
    const textAnchor: XAxisTickPlan["textAnchor"] =
      index === lastIndex ? "end" : "middle";
    return { value, show: !isRepeat, textAnchor };
  });
}

/** Formats "YYYY-MM" as "mmm/aa" in pt-BR (e.g. "2026-11" -> "nov/26"). */
export function formatYearMonthPtBr(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const idx = Number(month) - 1;
  if (!year || !Number.isInteger(idx) || idx < 0 || idx > 11) {
    return yearMonth;
  }
  return `${PT_MONTH_SHORT[idx]}/${year.slice(-2)}`;
}
