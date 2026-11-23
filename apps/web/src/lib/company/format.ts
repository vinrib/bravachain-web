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
 * Computes a safe clamped usage percentage (`0` to `100`) for progress bars.
 */
export function computeLimitUsagePercent(
  used: number | null,
  max: number | null,
): number {
  if (
    used === null ||
    max === null ||
    !Number.isFinite(used) ||
    !Number.isFinite(max) ||
    max <= 0 ||
    used <= 0
  ) {
    return 0;
  }
  const raw = Math.round((used / max) * 100);
  return Math.max(0, Math.min(100, raw));
}

/**
 * Formats an ISO timestamp or `YYYY-MM-DD` date strictly in `America/Sao_Paulo`
 * so negative/positive browser timezones never shift the calendar date.
 */
export function formatCompanyDateBr(input: string | Date): string {
  if (typeof input === "string") {
    const trimmed = input.trim();
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      return `${dateOnlyMatch[3]}/${dateOnlyMatch[2]}/${dateOnlyMatch[1]}`;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return trimmed;
    return SP_DATE_FORMATTER.format(parsed);
  }
  if (Number.isNaN(input.getTime())) return "";
  return SP_DATE_FORMATTER.format(input);
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
