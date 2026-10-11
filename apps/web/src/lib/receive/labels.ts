import type { BankDetails } from "./types";

/** Pending sentinel the backend uses for not-yet-confirmed bank fields. */
export const PENDING_VALUE = "A confirmar";

export function isPending(value: unknown): boolean {
  return typeof value === "string" && value.trim() === PENDING_VALUE;
}

const METHOD_LABELS: Record<string, string> = {
  USD_WIRE: "Dólar (USD) · Wire",
  USD_ACH: "Dólar (USD) · ACH",
  EUR_SEPA: "Euro (EUR) · SEPA",
};

export function methodLabel(method: string, fallback?: string): string {
  return METHOD_LABELS[method] ?? fallback ?? method;
}

export type StatusTone = "neutral" | "info" | "success" | "error";

const STATUS_LABELS: Record<string, { label: string; tone: StatusTone }> = {
  PENDING_DEPOSIT: { label: "Aguardando depósito", tone: "neutral" },
  DEPOSIT_PROCESSING: { label: "Depósito em processamento", tone: "info" },
  DEPOSIT_CONFIRMED: { label: "Depósito confirmado", tone: "info" },
  DELIVERY_PROCESSING: { label: "Entrega em processamento", tone: "info" },
  HOP1_PROCESSING: { label: "Processando (etapa 1)", tone: "info" },
  HOP1_COMPLETE: { label: "Etapa 1 concluída", tone: "info" },
  COMPLETED: { label: "Concluído", tone: "success" },
  FAILED: { label: "Falhou", tone: "error" },
  HOP1_FAILED: { label: "Falhou", tone: "error" },
  EXPIRED: { label: "Expirado", tone: "error" },
  CANCELLED: { label: "Cancelado", tone: "neutral" },
};

/** Known status → pt-BR label + tone; unknown → raw value, neutral tone. */
export function statusView(status: string): { label: string; tone: StatusTone } {
  return STATUS_LABELS[status] ?? { label: status, tone: "neutral" };
}

/**
 * Ordered bank-detail fields per currency (key + value). `wireMemo` is returned
 * last and handled with emphasis by the view. Labels live in the i18n dict.
 */
export function bankFieldOrder(
  details: BankDetails,
): Array<{ key: string; value: unknown }> {
  if ("iban" in details) {
    return [
      { key: "beneficiaryName", value: details.beneficiaryName },
      { key: "bankName", value: details.bankName },
      { key: "iban", value: details.iban },
      { key: "bic", value: details.bic },
      { key: "wireMemo", value: details.wireMemo },
    ];
  }
  return [
    { key: "beneficiaryName", value: details.beneficiaryName },
    { key: "bankName", value: details.bankName },
    { key: "accountNumber", value: details.accountNumber },
    { key: "routingNumber", value: details.routingNumber },
    { key: "swiftCode", value: details.swiftCode },
    { key: "wireMemo", value: details.wireMemo },
  ];
}
