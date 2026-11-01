/**
 * Maps PIX-withdrawal backend errors to how the UI should present them. The
 * backend returns `{ code, message }` (message already in pt-BR).
 *
 * For opaque/internal failures (provider error, the 412 "subaccount not
 * ready", and anything unknown) we NEVER show the raw body: provider/
 * subaccount get a fixed pt-BR message, and unknown errors get the generic
 * message plus a short support code (HTTP status + time) so support can
 * correlate it. The caller never retries the withdrawal automatically.
 *
 * Bravachain does not limit or hold client withdrawals (#92 removed the
 * per-tx/day caps, the own-CNPJ destination check and the 24h destination
 * hold) — only Avenia's own payout can fail. The only business code left is:
 * - WITHDRAW_PROVIDER_ERROR (varies) — opaque provider failure
 * - (HTTP 412)               — payments subaccount not provisioned yet
 */

export type WithdrawErrorField = "pixKey" | "amount" | null;

export interface WithdrawErrorView {
  /** Primary text to show the user — always pt-BR, never the raw body. */
  message: string;
  /** Which form field to highlight, if any. */
  field: WithdrawErrorField;
  /** Short support code (status + time) shown only on generic failures. */
  supportCode?: string;
}

export const GENERIC_WITHDRAW_ERROR =
  "Não foi possível solicitar o saque. Tente novamente.";

const PROVIDER_ERROR_MESSAGE =
  "Não foi possível processar o saque agora. Tente novamente em instantes.";

const SUBACCOUNT_NOT_READY_MESSAGE =
  "Sua subconta de pagamentos ainda está sendo preparada. Tente novamente em instantes.";

interface KnownWithdrawError {
  /** Fixed pt-BR text shown for this code. */
  fallback: string;
  field: WithdrawErrorField;
}

const KNOWN: Record<string, KnownWithdrawError> = {
  WITHDRAW_PROVIDER_ERROR: {
    fallback: PROVIDER_ERROR_MESSAGE,
    field: null,
  },
};

/** Compact support code from the HTTP status and the local time (HH:MM). */
export function formatSupportCode(
  status: number | null | undefined,
  now: Date = new Date(),
): string {
  const st = typeof status === "number" && status > 0 ? String(status) : "ERR";
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${st}-${hh}${mm}`;
}

export function mapWithdrawError(
  code: string | null | undefined,
  backendMessage?: string | null,
  status?: number | null,
  now: Date = new Date(),
): WithdrawErrorView {
  const known = code ? KNOWN[code] : undefined;
  if (known) {
    return { message: known.fallback, field: known.field };
  }

  // 412: the company's payments subaccount isn't provisioned yet. Keyed by
  // status (no stable code) — fixed pt-BR message, never the raw body.
  if (status === 412) {
    return { message: SUBACCOUNT_NOT_READY_MESSAGE, field: null };
  }

  // Unknown or missing code → generic message + short support code, no body.
  return {
    message: GENERIC_WITHDRAW_ERROR,
    field: null,
    supportCode: formatSupportCode(status, now),
  };
}
