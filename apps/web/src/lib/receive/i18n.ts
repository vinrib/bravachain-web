/**
 * Small PT/EN dictionary for the Recebimentos instructions view and the public
 * pay page. Only the static chrome is translated; dynamic backend content
 * (methodLabel, instructions[], warning) is shown as the backend returns it.
 */
export type Lang = "pt" | "en";

export interface ReceiveDict {
  amount: string;
  howToPay: string;
  settlement: string;
  memoTitle: string;
  memoHint: string;
  warningTitle: string;
  pendingTitle: string;
  pendingHint: string;
  copy: string;
  copied: string;
  pending: string;
  downloadPdf: string;
  from: string;
  fields: Record<string, string>;
  expiredTitle: string;
  expiredBody: string;
  notFoundTitle: string;
  notFoundBody: string;
  errorTitle: string;
  errorBody: string;
}

export const DICT: Record<Lang, ReceiveDict> = {
  pt: {
    amount: "Valor a pagar",
    howToPay: "Como pagar",
    settlement: "Prazo de liquidação",
    memoTitle: "Referência obrigatória (memo)",
    memoHint: "Inclua esta referência no pagamento, senão ele pode não ser identificado.",
    warningTitle: "Instruções ainda sendo confirmadas",
    pendingTitle: "Dados bancários em confirmação",
    pendingHint:
      "Alguns dados ainda estão sendo confirmados. Aguarde a confirmação antes de pagar ou compartilhar.",
    copy: "Copiar",
    copied: "Copiado",
    pending: "A confirmar",
    downloadPdf: "Baixar PDF",
    from: "Pagamento para",
    fields: {
      beneficiaryName: "Beneficiário",
      bankName: "Banco",
      accountNumber: "Número da conta",
      routingNumber: "Routing (ABA)",
      swiftCode: "SWIFT/BIC",
      iban: "IBAN",
      bic: "BIC/SWIFT",
      wireMemo: "Referência (memo)",
    },
    expiredTitle: "Link expirado",
    expiredBody: "Este link de pagamento não é mais válido. Peça um novo ao exportador.",
    notFoundTitle: "Link não encontrado",
    notFoundBody: "Confira o endereço do link de pagamento.",
    errorTitle: "Não foi possível carregar",
    errorBody: "Tente novamente em instantes.",
  },
  en: {
    amount: "Amount to pay",
    howToPay: "How to pay",
    settlement: "Settlement time",
    memoTitle: "Required reference (memo)",
    memoHint: "Include this reference in the payment, otherwise it may not be matched.",
    warningTitle: "Instructions still being confirmed",
    pendingTitle: "Bank details being confirmed",
    pendingHint:
      "Some details are still being confirmed. Please wait for confirmation before paying or sharing.",
    copy: "Copy",
    copied: "Copied",
    pending: "To be confirmed",
    downloadPdf: "Download PDF",
    from: "Payment to",
    fields: {
      beneficiaryName: "Beneficiary",
      bankName: "Bank",
      accountNumber: "Account number",
      routingNumber: "Routing (ABA)",
      swiftCode: "SWIFT/BIC",
      iban: "IBAN",
      bic: "BIC/SWIFT",
      wireMemo: "Reference (memo)",
    },
    expiredTitle: "Link expired",
    expiredBody: "This payment link is no longer valid. Ask the exporter for a new one.",
    notFoundTitle: "Link not found",
    notFoundBody: "Please check the payment link address.",
    errorTitle: "Could not load",
    errorBody: "Please try again shortly.",
  },
};
