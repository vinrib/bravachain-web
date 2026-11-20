/**
 * Types for "Enviar" (outbound remittance). The real contract lands with the
 * API 13/14 report; until it is on `main` the frontend uses the typed mocks in
 * `./mocks`, read through `./api`. Shapes mirror the agreed contract so the
 * swap to the real endpoints is a one-line change in `./api`.
 *
 * Bravachain never approves, rejects, limits, or holds a send — Avenia does.
 * Nothing here encodes a "our" limit or decision; availability and refusals are
 * always information returned by the API/Avenia.
 */

/** Currencies the user can send in. */
export type SendCurrency = "BRL" | "USD" | "EUR";

/** The rail each currency settles on (informational label, from the API). */
export type SendRail = "PIX" | "WIRE" | "SEPA";

/**
 * One payment channel. The front only shows a channel as available when the API
 * says `available: true`; enablement is done by Avenia, never by Bravachain.
 */
export interface SendChannel {
  currency: SendCurrency;
  /** Only `true` lets the card be selected. */
  available: boolean;
  rail: SendRail;
}

/**
 * The BRL rail is chosen by the user at registration (Pix key vs. bank account);
 * USD is always Wire and EUR always SEPA. `brlKind` distinguishes the two BRL
 * registration forms.
 */
export type BrlKind = "pix" | "conta";

/** Which registration form to render / validate. */
export type BeneficiaryFormKind = BrlKind | "USD" | "EUR";

/**
 * A saved beneficiary as the API returns it for the list: only a masked summary
 * (never full account/key data) is kept client-side. `line` is the masked
 * one-line summary the API builds; `rail` is an informational label.
 */
export interface BeneficiarySummary {
  id: string;
  currency: SendCurrency;
  /** Short pill label for the list: "Pix" | "Conta" | "Wire" | "SEPA". */
  railLabel: string;
  /** Initials for the avatar (e.g. "HC"). */
  initials: string;
  name: string;
  /** Masked summary line, e.g. "Lead Bank · conta ••••4821". */
  line: string;
}

/**
 * Quote line amounts, all in major units (decimals, per the backend's money
 * convention). BRL fields are in reais; `receiveAmount` is in the destination
 * currency. A line that is 0 is NOT displayed (business rule).
 */
export interface SendQuoteLines {
  sendAmount: number;
  aveniaFee: number;
  railFee: number;
  bravachainCommission: number;
  receiveAmount: number;
}

/**
 * A quote from POST /v1/send/quote. Everything shown to the user comes from
 * here — the front never computes its own ceiling. `enoughBalance` and any
 * refusal are the API's/Avenia's word, not Bravachain's.
 */
export interface SendQuote {
  quoteId: string;
  lines: SendQuoteLines;
  /** 1 destination unit = `referenceRate` BRL (1 for BRL). */
  referenceRate: number;
  /** ISO expiry; null when the quote does not expire (BRL). */
  expiresAt: string | null;
  isEstimate: boolean;
  balanceBrl: number;
  enoughBalance: boolean;
  invoiceRequired: boolean;
  /** When the API says false, the deposit message may not reach the recipient. */
  messageApplied: boolean;
}

/** A purpose code (finalidade) within a category. */
export interface PurposeItem {
  code: string;
  name: string;
  /** Category name (used as the second line when searching across categories). */
  category: string;
}

/** A finalidade category with its codes (two-level picker). */
export interface PurposeCategory {
  name: string;
  items: PurposeItem[];
}

/** The details the user fills on the Detalhes step. */
export interface SendDetails {
  message: string;
  /** Selected purpose code; null until chosen (required for USD/EUR). */
  purposeCode: string | null;
  /** Resolved purpose name (for the review summary); null when none chosen. */
  purposeName: string | null;
  /** True once an invoice file is attached (only when invoiceRequired). */
  invoiceAttached: boolean;
}

/** Lifecycle status of a send (from the API; no Bravachain decision). */
export type SendStatus = "processando" | "concluido" | "recusado" | "falha";

/** A created/listed send. `reason` carries Avenia's message when recusado/falha. */
export interface SendResult {
  id: string;
  status: SendStatus;
  reason?: string | null;
}

/** A row in the Extrato "Envios" filter. */
export interface SendListItem {
  id: string;
  currency: SendCurrency;
  beneficiaryName: string;
  /** BRL debited (positive; shown as "− R$ …"). */
  amountBrl: number;
  /** Destination amount; null for BRL (shows the rail instead). */
  receiveAmount: number | null;
  status: SendStatus;
  /** Display date, e.g. "04/11/2026". */
  createdAt: string;
}

/** Full send receipt (screen + print). No claim of legal validity. */
export interface SendReceipt {
  id: string;
  /** Avenia operation identifier. */
  identifier: string;
  createdAt: string;
  currency: SendCurrency;
  beneficiaryName: string;
  beneficiaryLine: string;
  lines: SendQuoteLines;
  referenceRate: number;
  message: string;
  purposeCode: string | null;
  purposeName: string | null;
  status: SendStatus;
}

/** Which side the user fixed, and the typed amount for that side. */
export interface QuoteInput {
  currency: SendCurrency;
  /** "send" fixes the BRL you pay; "receive" fixes the destination amount. */
  side: "send" | "receive";
  amount: number;
}

export const SEND_CURRENCIES: readonly SendCurrency[] = ["BRL", "USD", "EUR"];

/** URL slug <-> currency (routes live under /enviar/<slug>). */
export const CURRENCY_SLUG: Record<SendCurrency, string> = {
  BRL: "brl",
  USD: "usd",
  EUR: "eur",
};

export function currencyFromSlug(slug: string): SendCurrency | null {
  const hit = SEND_CURRENCIES.find((c) => CURRENCY_SLUG[c] === slug.toLowerCase());
  return hit ?? null;
}
