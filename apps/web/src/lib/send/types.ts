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
