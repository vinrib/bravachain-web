import { COMPANY_COPY } from "./copy";

const PT_BR_INTEGER_FORMATTER = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const PT_BR_DECIMAL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const SP_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const SP_DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const PT_BR_MONTH_ABBR: Record<string, string> = {
  "01": "jan",
  "02": "fev",
  "03": "mar",
  "04": "abr",
  "05": "mai",
  "06": "jun",
  "07": "jul",
  "08": "ago",
  "09": "set",
  "10": "out",
  "11": "nov",
  "12": "dez",
};

const USED_PCT_PATTERN = /^\d+(?:\.\d+)?$/;

/**
 * Formats a numeric limit amount in `pt-BR`. Whole numbers omit decimals for
 * readability (e.g. `250.000`); fractional values keep 2 decimals (`1.250,50`).
 */
export function formatLimitAmountPtBr(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const normalized = Object.is(value, -0) || Math.abs(value) === 0 ? 0 : value;
  if (Number.isInteger(normalized)) {
    return PT_BR_INTEGER_FORMATTER.format(normalized);
  }
  return PT_BR_DECIMAL_FORMATTER.format(normalized);
}

/**
 * Formats a backend `usedPct` decimal string (e.g. `"43.00"`, `"0.00"`, `"150.00"`)
 * into pt-BR display text (`"43,00%"`, `"0,00%"`, `"150,00%"`) strictly via string
 * manipulation — NEVER calls `parseFloat` or `Number` for display and NEVER
 * calculates percentages in the frontend.
 */
export function formatUsedPctPtBr(usedPct: string | null): string | null {
  if (typeof usedPct !== "string") return null;
  const trimmed = usedPct.trim();
  if (!USED_PCT_PATTERN.test(trimmed)) return null;

  const [rawInt = "", rawDec] = trimmed.split(".");
  const intFormatted = rawInt.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return rawDec !== undefined
    ? `${intFormatted},${rawDec}%`
    : `${intFormatted}%`;
}

/**
 * Derives visual-only bar width (`0..100`) and overflow flag (`> 100`) from the
 * backend `usedPct` string. Used ONLY for CSS bar width — displayed text always
 * comes from `formatUsedPctPtBr`.
 */
export function computeLimitBarScale(
  usedPct: string | null,
): { widthPct: number; exceeded: boolean } | null {
  if (typeof usedPct !== "string") return null;
  const trimmed = usedPct.trim();
  if (!USED_PCT_PATTERN.test(trimmed)) return null;

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return null;

  return {
    widthPct: Math.max(0, Math.min(100, numeric)),
    exceeded: numeric > 100,
  };
}

/**
 * Formats a `YYYY-MM` reference month into `"Uso mensal · nov/26"` strictly by
 * splitting the string (NEVER uses `new Date` and NEVER assumes the current month).
 * Returns `"Uso mensal · mês de referência não informado"` when absent or invalid.
 */
export function formatReferenceMonthPtBr(
  referenceMonth: string | null,
): string {
  if (typeof referenceMonth !== "string") {
    return COMPANY_COPY.limits.monthlyPeriodUnknown;
  }
  const parts = referenceMonth.trim().split("-");
  if (parts.length !== 2) {
    return COMPANY_COPY.limits.monthlyPeriodUnknown;
  }
  const [year, month] = parts;
  if (!year || !month || !/^\d{4}$/.test(year)) {
    return COMPANY_COPY.limits.monthlyPeriodUnknown;
  }
  const monthAbbr = PT_BR_MONTH_ABBR[month];
  if (!monthAbbr) {
    return COMPANY_COPY.limits.monthlyPeriodUnknown;
  }
  return `${COMPANY_COPY.limits.monthlyPeriodPrefix} · ${monthAbbr}/${year.slice(2)}`;
}

/**
 * Formats an ISO timestamp or `YYYY-MM-DD` date strictly in `America/Sao_Paulo`
 * as `dd/mm/yyyy` so negative/positive browser timezones never shift the date.
 */
export function formatCompanyDateBr(input: string | Date): string {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return "";
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      return `${dateOnlyMatch[3]}/${dateOnlyMatch[2]}/${dateOnlyMatch[1]}`;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return "";
    return SP_DATE_FORMATTER.format(parsed);
  }
  if (Number.isNaN(input.getTime())) return "";
  return SP_DATE_FORMATTER.format(input);
}

/**
 * Formats an ISO timestamp or `YYYY-MM-DD` date strictly in `America/Sao_Paulo`
 * as `dd/mm` (used in `"Enviado em dd/mm"` document status).
 */
export function formatCompanyDayMonthBr(input: string | Date): string {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return "";
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      return `${dateOnlyMatch[3]}/${dateOnlyMatch[2]}`;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return "";
    return SP_DAY_MONTH_FORMATTER.format(parsed);
  }
  if (Number.isNaN(input.getTime())) return "";
  return SP_DAY_MONTH_FORMATTER.format(input);
}

/**
 * Masks an 11-digit CPF as `***.XXX.XXX-**`. If already masked or non-standard,
 * preserves the masked representation without exposing extra digits.
 */
export function maskCpf(raw: string): string {
  const trimmed = raw.trim();
  if (/^\*{3}\.\d{3}\.\d{3}-\*{2}$/.test(trimmed)) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11) {
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }
  return trimmed;
}

/**
 * Formats a 14-digit CNPJ as `XX.XXX.XXX/XXXX-XX`.
 */
export function formatCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 14) return raw.trim();
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}
