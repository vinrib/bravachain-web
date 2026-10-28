/**
 * Client-side MFA calls.
 *
 * - `mfaVerify` hits the BFF (`/api/auth/mfa/verify`) because it exchanges the
 *   challenge token for a real session and therefore must set httpOnly cookies
 *   server-side — the same token path as login. No token touches client JS.
 * - `mfaEnrollStart` / `mfaEnrollConfirm` are authenticated (Bearer, ADMIN) and
 *   go through the existing authenticated proxy (`apiFetch`), which injects the
 *   access token server-side. The responses carry sensitive provisioning data
 *   and recovery codes; nothing here logs or persists them.
 */
import { endpoints, type MfaVerifyRequest } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import {
  normalizeEnrollStart,
  normalizeEnrollConfirm,
  type EnrollStart,
  type EnrollConfirm,
} from "./enroll";
import { mapMfaVerifyError, type MfaVerifyError } from "./errors";

/** A classified MFA-verify failure (invalid / locked / expired / generic). */
export class MfaVerifyFailure extends Error {
  constructor(public readonly view: MfaVerifyError) {
    super(view.kind);
    this.name = "MfaVerifyFailure";
  }
}

/**
 * Second-factor verification via the BFF. Resolves to `{ ok: true }`, or throws
 * {@link MfaVerifyFailure} carrying the classified reason so the UI can react
 * without re-inspecting raw HTTP. The lock countdown is read from both the
 * `Retry-After` header and the body.
 */
export async function mfaVerify(payload: MfaVerifyRequest): Promise<{ ok: true }> {
  const res = await fetch("/api/auth/mfa/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { message?: string; code?: string }
      | null;
    throw new MfaVerifyFailure(
      mapMfaVerifyError({
        status: res.status,
        code: body?.code ?? null,
        retryAfterHeader: res.headers.get("Retry-After"),
        body,
      }),
    );
  }
  return { ok: true };
}

/** Starts enrollment; returns the provisioning material (QR, secret, uri). */
export async function mfaEnrollStart(): Promise<EnrollStart> {
  const body = await apiFetch<unknown>(endpoints.auth.mfaEnrollStart, {
    method: "POST",
  });
  return normalizeEnrollStart(body);
}

/** Confirms the first TOTP code; returns the one-time recovery codes. */
export async function mfaEnrollConfirm(code: string): Promise<EnrollConfirm> {
  const body = await apiFetch<unknown>(endpoints.auth.mfaEnrollConfirm, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  return normalizeEnrollConfirm(body);
}
