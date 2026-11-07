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
import { MOCK_CHANNELS } from "./mocks";
import { SEND_CURRENCIES, type SendChannel, type SendCurrency, type SendRail } from "./types";

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
