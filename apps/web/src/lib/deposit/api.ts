"use client";

import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import type { PixQrCode, PixStatus } from "./types";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
function numN(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}
const strN = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

function normalizeQr(raw: unknown): PixQrCode {
  const r = obj(raw);
  return {
    txid: str(r.txid),
    valor: numN(r.valor),
    descricao: strN(r.descricao),
    pixCopiaECola: strN(r.pixCopiaECola),
    expiresAt: strN(r.expiresAt),
    status: str(r.status),
  };
}

export function createPixQrCode(
  body: { valor: number; descricao: string },
  idempotencyKey: string,
): Promise<PixQrCode> {
  return apiFetch<unknown>(endpoints.deposit.pixQrCode, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
  }).then(normalizeQr);
}

export function getPixStatus(txid: string): Promise<PixStatus> {
  return apiFetch<unknown>(endpoints.deposit.pixStatus(txid)).then((raw) => {
    const r = obj(raw);
    return { txid: str(r.txid) || txid, status: str(r.status) };
  });
}
