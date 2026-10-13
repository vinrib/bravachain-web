"use client";

import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import { normalizeReceipts } from "./normalize";
import type {
  ReceiptsQuery,
  ReceiptsResponse,
  SendReceiptEmailResponse,
} from "./types";

export function getReceipts(query: ReceiptsQuery = {}): Promise<ReceiptsResponse> {
  const p = new URLSearchParams();
  if (query.page) p.set("page", String(query.page));
  if (query.limit) p.set("limit", String(query.limit));
  const s = p.toString();
  return apiFetch<unknown>(`${endpoints.receipts.list}${s ? `?${s}` : ""}`).then(
    normalizeReceipts,
  );
}

/** Authenticated PDF download URL via the BFF proxy (keeps filename, no token). */
export function receiptPdfUrl(withdrawalId: string): string {
  return `/api/backend${endpoints.receipts.pdf(withdrawalId)}`;
}

export function sendReceiptEmail(
  withdrawalId: string,
  recipientEmail: string,
): Promise<SendReceiptEmailResponse> {
  return apiFetch<SendReceiptEmailResponse>(
    endpoints.receipts.sendEmail(withdrawalId),
    { method: "POST", body: JSON.stringify({ recipientEmail }) },
  );
}
