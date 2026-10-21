"use client";

import { endpoints } from "@bravachain/api-client";
import type { BackendPixKeyType } from "@bravachain/shared";
import { apiFetch } from "@/lib/client-api";

export type { BackendPixKeyType };

/**
 * Prévia de tarifa/líquido de um saque PIX (POST /v1/withdraw/pix/preview).
 * NÃO executa o saque — apenas calcula. Decimais de dinheiro são mantidos como
 * string (como o resto do app) para não perder precisão: só formatamos para
 * exibir, nunca para calcular (o backend é a fonte de todo valor mostrado).
 */
export interface WithdrawPreview {
  /** Valor solicitado, ecoado pelo backend (BRL). */
  amountBrla: string | null;
  /** Tarifa cobrada (BRL). */
  feeBrl: string | null;
  /** Valor líquido que o beneficiário recebe (BRL). */
  netAmountBrl: string | null;
  currency: string;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Mantém um decimal do backend como string (aceita número também). */
function decStrN(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function normalize(raw: unknown): WithdrawPreview {
  const r = obj(raw);
  return {
    amountBrla: decStrN(r.amountBrla),
    feeBrl: decStrN(r.feeBrl),
    netAmountBrl: decStrN(r.netAmountBrl),
    currency: str(r.currency) || "BRL",
  };
}

export function getWithdrawPreview(
  amountBrla: number,
  pixKeyType?: BackendPixKeyType,
  signal?: AbortSignal,
): Promise<WithdrawPreview> {
  return apiFetch<unknown>(endpoints.withdrawals.previewPix, {
    method: "POST",
    body: JSON.stringify(
      pixKeyType ? { amountBrla, pixKeyType } : { amountBrla },
    ),
    signal,
  }).then(normalize);
}
