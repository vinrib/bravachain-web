import "server-only";
import { endpoints } from "@bravachain/api-client";
import { serverEnv } from "@/lib/env";
import type { SessionTokens } from "./session";

/**
 * Thin server-side wrappers around the backend auth endpoints.
 *
 * These use raw `fetch` (not the typed client) so they work before the OpenAPI
 * schema is generated. Response shapes are normalized defensively — see
 * `extractTokens` — to minimize churn once the real schema lands.
 */

function backendUrl(path: string): string {
  return `${serverEnv.backendApiUrl}${path}`;
}

/** Pulls access/refresh tokens out of a variety of plausible response shapes. */
export function extractTokens(body: unknown): SessionTokens | null {
  if (!body || typeof body !== "object") return null;
  // Unwrap common envelopes: { data: {...} } or { tokens: {...} }.
  const record = body as Record<string, unknown>;
  const source =
    (record.tokens as Record<string, unknown> | undefined) ??
    (record.data as Record<string, unknown> | undefined) ??
    record;

  const accessToken =
    (source.accessToken as string | undefined) ??
    (source.access_token as string | undefined) ??
    (source.token as string | undefined);
  const refreshToken =
    (source.refreshToken as string | undefined) ??
    (source.refresh_token as string | undefined);

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    return null;
  }
  return { accessToken, refreshToken };
}

export interface BackendCallResult {
  status: number;
  ok: boolean;
  body: unknown;
}

async function postJson(path: string, payload: unknown): Promise<BackendCallResult> {
  const res = await fetch(backendUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body };
}

export function backendLogin(credentials: unknown): Promise<BackendCallResult> {
  return postJson(endpoints.auth.login, credentials);
}

export function backendSignup(payload: unknown): Promise<BackendCallResult> {
  return postJson(endpoints.auth.signup, payload);
}

/** Exchanges a refresh token for a rotated token pair. */
export async function refreshTokens(
  refreshToken: string,
): Promise<SessionTokens | null> {
  const { ok, body } = await postJson(endpoints.auth.refresh, { refreshToken });
  if (!ok) return null;
  return extractTokens(body);
}

/**
 * Best-effort server-side revocation on logout. The backend logout endpoint is
 * Bearer-guarded (it reads the user from the access token, no body), so we send
 * the access token as Authorization.
 */
export async function backendLogout(accessToken: string): Promise<void> {
  try {
    await fetch(backendUrl(endpoints.auth.logout), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    // Non-fatal: the local session is cleared regardless.
  }
}

export { backendUrl };
