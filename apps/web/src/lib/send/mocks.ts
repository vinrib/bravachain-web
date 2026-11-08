/**
 * Typed mock data for "Enviar", used until the API 13/14 `/v1/send/*` routes
 * land on `main`. Kept separate from `./api` so the swap to the real endpoints
 * is isolated and the mocks can be imported directly by tests.
 *
 * All three channels are available by default (the happy path). To exercise the
 * "channel unavailable" card, flip an entry's `available` to `false` here or
 * stub `getSendChannels` in a test.
 */
import type {
  BeneficiarySummary,
  PurposeCategory,
  SendChannel,
  SendCurrency,
  SendListItem,
} from "./types";

/** Mock BRL balance for quotes (major units). Only the API decides sufficiency. */
export const MOCK_BALANCE_BRL = 248315.4;

/** Reference rate: 1 destination unit = N BRL. */
export const QUOTE_RATE: Record<SendCurrency, number> = { BRL: 1, USD: 5.54, EUR: 6.42 };

/** [aveniaFee, railFee, bravachainCommission] in BRL (major units). */
export const QUOTE_FEES: Record<SendCurrency, [number, number, number]> = {
  BRL: [2, 1, 5],
  USD: [48, 55.4, 202],
  EUR: [48, 6.42, 202],
};

/**
 * Illustrative purpose codes (finalidade), two levels. The official list comes
 * from Avenia via GET /v1/send/purpose-codes; these mirror the design sample.
 */
export const MOCK_PURPOSE_CATEGORIES: PurposeCategory[] = [
  {
    name: "Comércio exterior",
    items: [
      { code: "12995", name: "Compra ou venda de mercadoria", category: "Comércio exterior" },
      { code: "12010", name: "Exportação de mercadorias", category: "Comércio exterior" },
      { code: "12020", name: "Importação — pagamento antecipado", category: "Comércio exterior" },
    ],
  },
  {
    name: "Viagens internacionais",
    items: [
      { code: "27002", name: "Viagens a negócios", category: "Viagens internacionais" },
      { code: "27031", name: "Despesas com educação", category: "Viagens internacionais" },
    ],
  },
  {
    name: "Transferências unilaterais",
    items: [
      { code: "37015", name: "Manutenção de residentes", category: "Transferências unilaterais" },
      { code: "37020", name: "Doações", category: "Transferências unilaterais" },
    ],
  },
  {
    name: "Serviços diversos",
    items: [
      { code: "47555", name: "Serviços de consultoria", category: "Serviços diversos" },
      { code: "47505", name: "Serviços de tecnologia da informação", category: "Serviços diversos" },
      { code: "47120", name: "Serviços de publicidade", category: "Serviços diversos" },
    ],
  },
  {
    name: "Capitais brasileiros",
    items: [
      { code: "50011", name: "Investimento direto no exterior", category: "Capitais brasileiros" },
    ],
  },
  {
    name: "Capitais estrangeiros",
    items: [
      { code: "65050", name: "Retorno de investimento estrangeiro", category: "Capitais estrangeiros" },
    ],
  },
  {
    name: "Outros",
    items: [{ code: "99999", name: "Outras finalidades", category: "Outros" }],
  },
];

/** Example sends for the Extrato "Envios" filter (example values, never real). */
export const MOCK_SENDS: SendListItem[] = [
  { id: "snd-1", currency: "USD", beneficiaryName: "Harbor Coffee Imports LLC", amountBrl: 10000, receiveAmount: 1749.93, status: "concluido", createdAt: "04/11/2026" },
  { id: "snd-2", currency: "EUR", beneficiaryName: "Maison Verte SARL", amountBrl: 6420, receiveAmount: 960.06, status: "processando", createdAt: "04/11/2026" },
  { id: "snd-3", currency: "BRL", beneficiaryName: "Transportes Litoral Ltda", amountBrl: 2500, receiveAmount: null, status: "concluido", createdAt: "03/11/2026" },
  { id: "snd-4", currency: "USD", beneficiaryName: "Northpoint Packaging Inc.", amountBrl: 15000, receiveAmount: 2652.45, status: "recusado", createdAt: "31/10/2026" },
  { id: "snd-5", currency: "EUR", beneficiaryName: "Kaffeehaus GmbH", amountBrl: 4200, receiveAmount: 614.26, status: "falha", createdAt: "30/10/2026" },
];

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
