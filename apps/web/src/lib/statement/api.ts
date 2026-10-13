"use client";

import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import { normalizeStatement } from "./normalize";
import type { StatementQuery, StatementResponse } from "./types";

function qs(query: StatementQuery): string {
  const p = new URLSearchParams();
  if (query.startDate) p.set("startDate", query.startDate);
  if (query.endDate) p.set("endDate", query.endDate);
  if (query.type) p.set("type", query.type);
  if (query.page) p.set("page", String(query.page));
  if (query.limit) p.set("limit", String(query.limit));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function getStatement(query: StatementQuery): Promise<StatementResponse> {
  return apiFetch<unknown>(`${endpoints.statement.list}${qs(query)}`).then(
    normalizeStatement,
  );
}

/**
 * Authenticated export download URL through the BFF proxy. The browser sends
 * the session cookie automatically; the proxy attaches the bearer token and
 * preserves the attachment filename. No token is exposed to the client.
 */
export function statementExportUrl(
  query: StatementQuery,
  format: "csv" | "pdf",
): string {
  const p = new URLSearchParams();
  if (query.startDate) p.set("startDate", query.startDate);
  if (query.endDate) p.set("endDate", query.endDate);
  if (query.type) p.set("type", query.type);
  p.set("format", format);
  return `/api/backend${endpoints.statement.export}?${p.toString()}`;
}
