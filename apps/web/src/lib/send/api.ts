"use client";

/**
 * Data access for "Enviar". While the API 13/14 `/v1/send/*` routes are not on
 * `main`, every function resolves the typed mocks in `./mocks`. When the real
 * endpoints ship, flip `SEND_API_READY` to `true`: the real calls below go
 * through the same BFF `apiFetch`, and the normalizers map the response keys
 * defensively (same pattern as lib/deposit, lib/rates, lib/receive).
 */
import { endpoints } from "@bravachain/api-client";
import { apiFetch, ApiError } from "@/lib/client-api";
import {
  MOCK_BALANCE_BRL,
  MOCK_BENEFICIARIES,
  MOCK_CHANNELS,
  MOCK_PURPOSE_CATEGORIES,
  QUOTE_FEES,
  QUOTE_RATE,
} from "./mocks";
import {
  SEND_CURRENCIES,
  type BeneficiaryFormKind,
  type BeneficiarySummary,
  type PurposeCategory,
  type QuoteInput,
  type SendChannel,
  type SendCurrency,
  type SendQuote,
  type SendRail,
} from "./types";

/** Flip to `true` once /v1/send/* is live on the backend. */
const SEND_API_READY = false;

/** Small delay so loading/skeleton states are exercised against the mock. */
const MOCK_LATENCY_MS = 350;
const mockDelay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});

const RAILS: readonly SendRail[] = ["PIX", "WIRE", "SEPA"];
const isCurrency = (v: unknown): v is SendCurrency =>
  typeof v === "string" && (SEND_CURRENCIES as readonly string[]).includes(v);
const asRail = (v: unknown): SendRail =>
  typeof v === "string" && (RAILS as readonly string[]).includes(v) ? (v as SendRail) : "WIRE";

function normalizeChannels(raw: unknown): SendChannel[] {
  const r = obj(raw);
  const list = Array.isArray(r.channels) ? r.channels : Array.isArray(raw) ? raw : [];
  return list
    .map((item) => {
      const c = obj(item);
      if (!isCurrency(c.currency)) return null;
      return {
        currency: c.currency,
        available: c.available === true,
        rail: asRail(c.rail),
      } satisfies SendChannel;
    })
    .filter((c): c is SendChannel => c !== null);
}

/**
 * Payment channels for the currency-choice screen. A card is only selectable
 * when its channel is `available` (enablement is Avenia's, never Bravachain's).
 */
export function getSendChannels(): Promise<SendChannel[]> {
  if (SEND_API_READY) {
    return apiFetch<unknown>(endpoints.send.channels).then(normalizeChannels);
  }
  return mockDelay(MOCK_CHANNELS.map((c) => ({ ...c })));
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");

function normalizeBeneficiaries(raw: unknown, currency: SendCurrency): BeneficiarySummary[] {
  const r = obj(raw);
  const list = Array.isArray(r.beneficiaries)
    ? r.beneficiaries
    : Array.isArray(raw)
      ? raw
      : [];
  return list.map((item, i) => {
    const b = obj(item);
    const name = str(b.name);
    return {
      id: str(b.id) || `${currency}-${i}`,
      currency: isCurrency(b.currency) ? b.currency : currency,
      railLabel: str(b.railLabel) || str(b.rail),
      initials: str(b.initials) || initialsOf(name),
      name,
      line: str(b.line),
    } satisfies BeneficiarySummary;
  });
}

/** Two-letter initials from a name, for the list avatar. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "—";
}

/** Saved beneficiaries for a currency (masked summaries only). */
export function getBeneficiaries(currency: SendCurrency): Promise<BeneficiarySummary[]> {
  if (SEND_API_READY) {
    return apiFetch<unknown>(endpoints.send.beneficiaries).then((raw) =>
      normalizeBeneficiaries(raw, currency).filter((b) => b.currency === currency),
    );
  }
  return mockDelay(MOCK_BENEFICIARIES[currency].map((b) => ({ ...b })));
}

const RAIL_LABEL: Record<BeneficiaryFormKind, string> = {
  pix: "Pix",
  conta: "Conta",
  USD: "Wire",
  EUR: "SEPA",
};

const last4 = (s: string): string => s.replace(/\s/g, "").slice(-4);

/** Masked one-line summary for the list, built from the raw registration input. */
function summaryLine(kind: BeneficiaryFormKind, v: Record<string, string>): string {
  if (kind === "pix") return `Pix · ${v.ch ?? ""}`.trim();
  if (kind === "conta") {
    const bank = (v.bc ?? "").replace(/^\d+\s*—\s*/, "") || "Banco";
    return `${bank} · Ag ${v.ag ?? ""} · CC ${v.cc ?? ""}`;
  }
  if (kind === "USD") return `${v.bk ?? "Banco"} · conta ••••${last4(v.ac ?? "")}`;
  const iban = (v.iban ?? "").replace(/\s/g, "");
  return `IBAN ${iban.slice(0, 4)} •••• ${iban.slice(-4)}`;
}

/**
 * Creates a beneficiary. The mock returns only the masked summary (full
 * account/key data never leaves the registration form); the real endpoint
 * likewise returns the saved summary.
 */
const round2 = (n: number): number => Math.round(n * 100) / 100;
const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

/** Builds the example quote (never real) matching the Web 12 sample values. */
function computeMockQuote(input: QuoteInput): SendQuote {
  const { currency, side, amount } = input;
  const rate = QUOTE_RATE[currency];
  const [aveniaFee, railFee, bravachainCommission] = QUOTE_FEES[currency];
  const feeSum = aveniaFee + railFee + bravachainCommission;

  let sendAmount: number;
  let receiveAmount: number;
  if (currency === "BRL" || side === "send") {
    sendAmount = amount;
    const net = Math.max(0, round2(sendAmount - feeSum));
    receiveAmount = currency === "BRL" ? net : round2(net / rate);
  } else {
    receiveAmount = amount;
    sendAmount = round2(round2(receiveAmount * rate) + feeSum);
  }

  return {
    quoteId: `q_${Date.now()}`,
    lines: { sendAmount, aveniaFee, railFee, bravachainCommission, receiveAmount },
    referenceRate: rate,
    // BRL does not expire (no FX); USD/EUR hold for 5 min.
    expiresAt: currency === "BRL" ? null : new Date(Date.now() + 300_000).toISOString(),
    isEstimate: true,
    balanceBrl: MOCK_BALANCE_BRL,
    enoughBalance: sendAmount <= MOCK_BALANCE_BRL,
    // Invoice is required above a sample threshold; the message always applies.
    invoiceRequired: currency !== "BRL" && sendAmount >= 50000,
    messageApplied: true,
  };
}

function normalizeQuote(raw: unknown): SendQuote {
  const r = obj(raw);
  const l = obj(r.lines);
  return {
    quoteId: str(r.quoteId),
    lines: {
      sendAmount: num(l.sendAmount),
      aveniaFee: num(l.aveniaFee),
      railFee: num(l.railFee),
      bravachainCommission: num(l.bravachainCommission),
      receiveAmount: num(l.receiveAmount),
    },
    referenceRate: num(r.referenceRate, 1),
    expiresAt: typeof r.expiresAt === "string" ? r.expiresAt : null,
    isEstimate: r.isEstimate !== false,
    balanceBrl: num(r.balanceBrl),
    enoughBalance: r.enoughBalance === true,
    invoiceRequired: r.invoiceRequired === true,
    messageApplied: r.messageApplied !== false,
  };
}

/**
 * Quote for the amount step. The front shows exactly what this returns —
 * including `enoughBalance`; it never validates its own ceiling.
 */
/** Mock-only cap that stands in for an Avenia-informed limit (not a Bravachain rule). */
const MOCK_AVENIA_LIMIT_BRL = 1_000_000;

export function getQuote(input: QuoteInput, signal?: AbortSignal): Promise<SendQuote> {
  if (SEND_API_READY) {
    return apiFetch<unknown>(endpoints.send.quote, {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    }).then(normalizeQuote);
  }
  const quote = computeMockQuote(input);
  if (quote.lines.sendAmount > MOCK_AVENIA_LIMIT_BRL) {
    // Surfaced to the user as "A Avenia informou: …" — Avenia's limit, not ours.
    return new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new ApiError(
              422,
              "o valor ultrapassa o limite disponível para esta conta. Ajuste o valor para continuar.",
              "AVENIA_LIMIT",
            ),
          ),
        MOCK_LATENCY_MS,
      ),
    );
  }
  return mockDelay(quote);
}

function normalizePurposeCategories(raw: unknown): PurposeCategory[] {
  const r = obj(raw);
  const list = Array.isArray(r.categories) ? r.categories : Array.isArray(raw) ? raw : [];
  return list.map((cat) => {
    const c = obj(cat);
    const name = str(c.name);
    const items = Array.isArray(c.items) ? c.items : [];
    return {
      name,
      items: items.map((it) => {
        const i = obj(it);
        return { code: str(i.code), name: str(i.name), category: str(i.category) || name };
      }),
    } satisfies PurposeCategory;
  });
}

/** Two-level purpose codes (finalidade). Official list is Avenia's. */
export function getPurposeCodes(): Promise<PurposeCategory[]> {
  if (SEND_API_READY) {
    return apiFetch<unknown>(endpoints.send.purposeCodes).then(normalizePurposeCategories);
  }
  return mockDelay(MOCK_PURPOSE_CATEGORIES.map((c) => ({ ...c, items: [...c.items] })));
}

export function createBeneficiary(input: {
  kind: BeneficiaryFormKind;
  currency: SendCurrency;
  values: Record<string, string>;
}): Promise<BeneficiarySummary> {
  const { kind, currency, values } = input;
  const name = (values.nm ?? "").trim();
  const summary: BeneficiarySummary = {
    id: `${currency}-new-${Date.now()}`,
    currency,
    railLabel: RAIL_LABEL[kind],
    initials: initialsOf(name),
    name,
    line: summaryLine(kind, values),
  };
  if (SEND_API_READY) {
    return apiFetch<unknown>(endpoints.send.beneficiaries, {
      method: "POST",
      body: JSON.stringify({ kind, currency, ...values }),
    }).then((raw) => normalizeBeneficiaries({ beneficiaries: [raw] }, currency)[0] ?? summary);
  }
  return mockDelay(summary);
}
