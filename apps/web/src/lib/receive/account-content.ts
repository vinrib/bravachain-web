import type { DedicatedAccount } from "./types";

/**
 * Fixed, product-approved copy for the "Dados de conta" screen. Everything here
 * was explicitly approved — nothing is inferred or invented. Values the backend
 * does not provide (fees, availability, bank address, account type, balance)
 * are intentionally absent.
 */

export const ACCOUNT_SECURITY_NOTICE =
  "Use estes dados apenas para receber pagamentos em nome da sua empresa. Confira o nome do beneficiário e inclua sempre o memo/referência. A Bravachain nunca pede senha nem altera dados bancários por e-mail ou mensagem.";

export const ACCOUNT_FEE_NOTE =
  "Taxas e câmbio são exibidos na estimativa de cada recebimento.";

export const ACCOUNT_MIN_RECOMMENDATION =
  "Recomendamos pagamentos de pelo menos US$ 200: a tarifa fixa de transferência internacional pesa mais em valores pequenos.";

export function pendingAccountText(currency: string): string {
  return `Sua conta em ${currency} está sendo ativada. Os dados bancários aparecem aqui assim que ficarem prontos.`;
}

/** Settlement times the backend affirms, per currency/method (approved text). */
export const SETTLEMENT: Record<string, Array<{ method: string; time: string }>> = {
  USD: [
    { method: "Wire", time: "geralmente no mesmo dia útil, sujeito ao banco" },
    { method: "ACH", time: "1 a 3 dias úteis" },
  ],
  EUR: [{ method: "SEPA", time: "1 a 2 dias úteis" }],
};

export function currencyTitle(currency: string): string {
  if (currency === "USD") return "Conta em dólar (USD)";
  if (currency === "EUR") return "Conta em euro (EUR)";
  return `Conta em ${currency}`;
}

const LABELS: Record<string, string> = {
  beneficiaryName: "Titular",
  bankName: "Banco",
  accountNumber: "Número da conta",
  routingNumber: "Routing (ABA)",
  iban: "IBAN",
  swift: "SWIFT/BIC",
  reference: "Referência",
};

const ORDER = [
  "beneficiaryName",
  "bankName",
  "accountNumber",
  "routingNumber",
  "iban",
  "swift",
  "reference",
] as const;

export interface AccountField {
  key: string;
  label: string;
  value: string;
}

/** Present (non-empty) fields, in display order. */
export function accountFields(account: DedicatedAccount): AccountField[] {
  const fields: AccountField[] = [];
  for (const key of ORDER) {
    const value = account[key];
    if (typeof value === "string" && value.trim().length > 0) {
      fields.push({ key, label: LABELS[key] ?? key, value });
    }
  }
  return fields;
}

/** "Copiar todos" text — only available fields; never pending placeholders. */
export function copyAllText(fields: AccountField[]): string {
  return fields.map((f) => `${f.label}: ${f.value}`).join("\n");
}
