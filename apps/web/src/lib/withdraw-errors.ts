/**
 * Maps PIX-withdrawal "Regra A" backend errors to how the UI should present
 * them. The backend returns `{ code, message }` (message already in pt-BR).
 *
 * For the known business codes we show the backend `message` verbatim (it
 * carries the concrete limits/dates), falling back to a fixed pt-BR text when
 * the backend omits one. For opaque/internal failures (provider error, the
 * 412 "subaccount not ready", and anything unknown) we NEVER show the raw body:
 * provider/subaccount get a fixed pt-BR message, and unknown errors get the
 * generic message plus a short support code (HTTP status + time) so support can
 * correlate it. The caller never retries the withdrawal automatically.
 *
 * Known codes (HTTP status from the backend):
 * - WITHDRAW_PROVIDER_ERROR            (varies) — opaque provider failure
 * - WITHDRAW_LIMIT_PER_TX              (422) — above per-withdrawal limit
 * - WITHDRAW_LIMIT_PER_DAY             (422) — daily withdrawal limit reached
 * - WITHDRAW_DESTINATION_NOT_OWN_CNPJ  (403) — destination isn't the company's CNPJ
 * - WITHDRAW_DESTINATION_ON_HOLD       (422) — key under a 24h security hold
 * - (HTTP 412)                         — payments subaccount not provisioned yet
 */

export type WithdrawErrorField = "pixKey" | "amount" | null;

export interface WithdrawErrorView {
  /** Primary text to show the user — always pt-BR, never the raw body. */
  message: string;
  /** Which form field to highlight, if any. */
  field: WithdrawErrorField;
  /** Whether to render the 24h security-hold banner. */
  hold: boolean;
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
  /** Fixed pt-BR text. Used as fallback, or always when `useBackendMessage` is false. */
  fallback: string;
  /** Whether to prefer the backend message (business errors) over `fallback`. */
  useBackendMessage: boolean;
  field: WithdrawErrorField;
  hold: boolean;
}

const KNOWN: Record<string, KnownWithdrawError> = {
  WITHDRAW_PROVIDER_ERROR: {
    fallback: PROVIDER_ERROR_MESSAGE,
    useBackendMessage: false,
    field: null,
    hold: false,
  },
  WITHDRAW_DESTINATION_NOT_OWN_CNPJ: {
    fallback: "A chave PIX precisa estar no CNPJ da sua empresa.",
    useBackendMessage: true,
    field: "pixKey",
    hold: false,
  },
  WITHDRAW_LIMIT_PER_TX: {
    fallback: "Valor acima do limite por saque.",
    useBackendMessage: true,
    field: "amount",
    hold: false,
  },
  WITHDRAW_LIMIT_PER_DAY: {
    fallback: "Limite de saques do dia atingido.",
    useBackendMessage: true,
    field: "amount",
    hold: false,
  },
  WITHDRAW_DESTINATION_ON_HOLD: {
    fallback: "Esta chave PIX está em validação de segurança por 24h.",
    useBackendMessage: true,
    field: "pixKey",
    hold: true,
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
    const trimmed = backendMessage?.trim();
    const message =
      known.useBackendMessage && trimmed && trimmed.length > 0 ? trimmed : known.fallback;
    return { message, field: known.field, hold: known.hold };
  }

  // 412: the company's payments subaccount isn't provisioned yet. Keyed by
  // status (no stable code) — fixed pt-BR message, never the raw body.
  if (status === 412) {
    return { message: SUBACCOUNT_NOT_READY_MESSAGE, field: null, hold: false };
  }

  // Unknown or missing code → generic message + short support code, no body.
  return {
    message: GENERIC_WITHDRAW_ERROR,
    field: null,
    hold: false,
    supportCode: formatSupportCode(status, now),
  };
}
