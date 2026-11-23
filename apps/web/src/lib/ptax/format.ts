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
 * - Accepts digits and at most one decimal separator (`,` or `.`).
 * - Max 15 integer digits and max 6 decimal places (mirroring API regex).
 * - Must be strictly positive (> 0).
 */
export type CalculatorAmountNormalization =
  | { status: "empty" }
  | { status: "valid"; normalized: string }
  | { status: "invalid" };

export function normalizeCalculatorAmount(
  raw: string,
): CalculatorAmountNormalization {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { status: "empty" };
  }

  // Reject anything containing whitespace inside, signs, letters, or more than one separator
  if (!/^[0-9.,]+$/.test(trimmed)) {
    return { status: "invalid" };
  }

  const sepMatches = trimmed.match(/[.,]/g);
  if (sepMatches && sepMatches.length > 1) {
    return { status: "invalid" };
  }

  const normalized = trimmed.replace(",", ".");
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
 */
export function toChartScaleNumber(decimalStr: string): number {
  const n = Number(decimalStr);
  return Number.isFinite(n) ? n : 0;
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

/** Formats "YYYY-MM" as "mmm/aa" in pt-BR (e.g. "2026-11" -> "nov/26"). */
export function formatYearMonthPtBr(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const idx = Number(month) - 1;
  if (!year || !Number.isInteger(idx) || idx < 0 || idx > 11) {
    return yearMonth;
  }
  return `${PT_MONTH_SHORT[idx]}/${year.slice(-2)}`;
}
