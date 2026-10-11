/**
 * Maps PIX-withdrawal "Regra A" backend errors to how the UI should present
 * them. The backend returns only `{ code, message }` (message already in
 * pt-BR, with any numbers/dates inline); we show that message verbatim and use
 * the `code` solely to decide which field to highlight and whether to show the
 * 24h security-hold banner. Unknown or missing codes fall back to a generic
 * message so no internal detail leaks.
 *
 * Known codes (HTTP status from the backend):
 * - WITHDRAW_DESTINATION_NOT_OWN_CNPJ  (403) — destination isn't the company's CNPJ
 * - WITHDRAW_LIMIT_PER_TX              (422) — above per-withdrawal limit
 * - WITHDRAW_LIMIT_PER_DAY             (422) — daily withdrawal limit reached
 * - WITHDRAW_DESTINATION_ON_HOLD       (422) — key under a 24h security hold
 */

export type WithdrawErrorField = "pixKey" | "amount" | null;

export interface WithdrawErrorView {
  /** Primary text to show the user (the backend message, when usable). */
  message: string;
  /** Which form field to highlight, if any. */
  field: WithdrawErrorField;
  /** Whether to render the 24h security-hold banner. */
  hold: boolean;
}

export const GENERIC_WITHDRAW_ERROR =
  "Não foi possível solicitar o saque. Tente novamente.";

interface KnownWithdrawError {
  /** Fallback, used only when the backend omits a message for this code. */
  fallback: string;
  field: WithdrawErrorField;
  hold: boolean;
}

const KNOWN: Record<string, KnownWithdrawError> = {
  WITHDRAW_DESTINATION_NOT_OWN_CNPJ: {
    fallback: "A chave PIX precisa estar no CNPJ da sua empresa.",
    field: "pixKey",
    hold: false,
  },
  WITHDRAW_LIMIT_PER_TX: {
    fallback: "Valor acima do limite por saque.",
    field: "amount",
    hold: false,
  },
  WITHDRAW_LIMIT_PER_DAY: {
    fallback: "Limite de saques do dia atingido.",
    field: "amount",
    hold: false,
  },
  WITHDRAW_DESTINATION_ON_HOLD: {
    fallback: "Esta chave PIX está em validação de segurança por 24h.",
    field: "pixKey",
    hold: true,
  },
};

export function mapWithdrawError(
  code: string | null | undefined,
  backendMessage?: string | null,
): WithdrawErrorView {
  const known = code ? KNOWN[code] : undefined;
  if (known) {
    const trimmed = backendMessage?.trim();
    return {
      message: trimmed && trimmed.length > 0 ? trimmed : known.fallback,
      field: known.field,
      hold: known.hold,
    };
  }
  // Unknown or missing code → generic, no internal detail.
  return { message: GENERIC_WITHDRAW_ERROR, field: null, hold: false };
}
