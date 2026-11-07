"use client";

/**
 * Data access for "Enviar". While the API 13/14 `/v1/send/*` routes are not on
 * `main`, every function resolves the typed mocks in `./mocks`. When the real
 * endpoints ship, flip `SEND_API_READY` to `true`: the real calls below go
 * through the same BFF `apiFetch`, and the normalizers map the response keys
 * defensively (same pattern as lib/deposit, lib/rates, lib/receive).
 */
import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import { MOCK_BENEFICIARIES, MOCK_CHANNELS } from "./mocks";
import {
  SEND_CURRENCIES,
  type BeneficiaryFormKind,
  type BeneficiarySummary,
  type SendChannel,
  type SendCurrency,
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
