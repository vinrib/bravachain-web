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
