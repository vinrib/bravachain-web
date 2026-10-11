"use client";

/**
 * Client-side calls for the Recebimentos feature. All go through the
 * authenticated BFF proxy (`/api/backend/...`), which attaches the bearer
 * token server-side; the browser never sees it. The Idempotency-Key header is
 * forwarded by the proxy to the backend.
 */
import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import type {
  CreateReceiveBody,
  CreateReceiveResponse,
  Instructions,
  PixKeyResponse,
  ReceiveStatus,
} from "./types";

export function getPixKey(): Promise<PixKeyResponse> {
  return apiFetch<PixKeyResponse>(endpoints.receive.pixKey);
}

export function savePixKey(pixKey: string): Promise<PixKeyResponse> {
  return apiFetch<PixKeyResponse>(endpoints.receive.pixKey, {
    method: "PUT",
    body: JSON.stringify({ pixKey }),
  });
}

export function deletePixKey(): Promise<PixKeyResponse> {
  return apiFetch<PixKeyResponse>(endpoints.receive.pixKey, { method: "DELETE" });
}

export function createReceive(
  body: CreateReceiveBody,
  idempotencyKey: string,
): Promise<CreateReceiveResponse> {
  return apiFetch<CreateReceiveResponse>(endpoints.receive.requestPayment, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
  });
}

export function getInstructions(ticketId: string): Promise<Instructions> {
  return apiFetch<Instructions>(endpoints.receive.instructions(ticketId));
}

export function getStatus(ticketId: string): Promise<ReceiveStatus> {
  return apiFetch<ReceiveStatus>(endpoints.receive.status(ticketId));
}

/** Blocked by feature flag until the backend exposes InboundRemittance.id. */
export function renewShareToken(id: string): Promise<unknown> {
  return apiFetch(endpoints.receive.renewToken(id), { method: "POST" });
}
