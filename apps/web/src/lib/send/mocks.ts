/**
 * Typed mock data for "Enviar", used until the API 13/14 `/v1/send/*` routes
 * land on `main`. Kept separate from `./api` so the swap to the real endpoints
 * is isolated and the mocks can be imported directly by tests.
 *
 * All three channels are available by default (the happy path). To exercise the
 * "channel unavailable" card, flip an entry's `available` to `false` here or
 * stub `getSendChannels` in a test.
 */
import type { BeneficiarySummary, SendChannel, SendCurrency } from "./types";

export const MOCK_CHANNELS: SendChannel[] = [
  { currency: "BRL", available: true, rail: "PIX" },
  { currency: "USD", available: true, rail: "WIRE" },
  { currency: "EUR", available: true, rail: "SEPA" },
];

/**
 * Saved beneficiaries per currency (masked summaries only). Mirrors the design
 * sample data; replaced by GET /v1/send/beneficiaries when the API lands.
 */
export const MOCK_BENEFICIARIES: Record<SendCurrency, BeneficiarySummary[]> = {
  BRL: [
    {
      id: "brl-1",
      currency: "BRL",
      railLabel: "Pix",
      initials: "TL",
      name: "Transportes Litoral Ltda",
      line: "Pix · CNPJ 12.345.678/0001-90",
    },
    {
      id: "brl-2",
      currency: "BRL",
      railLabel: "Conta",
      initials: "GA",
      name: "Gráfica Amazonas Ltda",
      line: "Itaú · Ag 0412 · CC 33871-2",
    },
  ],
  USD: [
    {
      id: "usd-1",
      currency: "USD",
      railLabel: "Wire",
      initials: "HC",
      name: "Harbor Coffee Imports LLC",
      line: "Lead Bank · conta ••••4821",
    },
    {
      id: "usd-2",
      currency: "USD",
      railLabel: "Wire",
      initials: "NP",
      name: "Northpoint Packaging Inc.",
      line: "JPMorgan Chase · conta ••••0937",
    },
    {
      id: "usd-3",
      currency: "USD",
      railLabel: "Wire",
      initials: "BS",
      name: "Blue Sky Logistics Corp.",
      line: "Wells Fargo · conta ••••1150",
    },
  ],
  EUR: [
    {
      id: "eur-1",
      currency: "EUR",
      railLabel: "SEPA",
      initials: "MV",
      name: "Maison Verte SARL",
      line: "IBAN FR76 •••• 4410",
    },
    {
      id: "eur-2",
      currency: "EUR",
      railLabel: "SEPA",
      initials: "KG",
      name: "Kaffeehaus GmbH",
      line: "IBAN DE89 •••• 3000",
    },
  ],
};
