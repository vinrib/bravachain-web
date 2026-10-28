/**
 * Manual request/response types for the TOTP MFA auth endpoints added by the
 * backend in PR #84 (in production). These are NOT yet present in the committed
 * `openapi.json`: the backend's Swagger is prod-guarded, so the spec can't be
 * regenerated from a live doc, and `openapi.json` must not be hand-edited.
 *
 * Field names below are CONFIRMED against the backend source (`src/auth/mfa/*`
 * and `src/auth/auth.service.ts`): login → `{ mfaRequired, mfaToken }`;
 * enroll/start → `{ otpauthUri, qrDataUrl, secret }`; enroll/confirm and
 * recovery-codes/regenerate → `{ recoveryCodes }`; verify takes
 * `{ mfaToken, code | recoveryCode }`. The BFF/web layers still read them
 * defensively (see `apps/web/src/lib/mfa`). NOTE: verify returns a SINGLE opaque
 * 401 for every failure (bad/expired/locked) — no code, no retry time.
 * Remove this file once the backend OpenAPI is regenerated with the MFA routes.
 *
 * Contracts:
 * - POST /v1/auth/login
 *     for an ADMIN with MFA active -> 200 { mfaRequired: true, mfaToken }
 *     (NO tokens); every other account keeps the current token-pair shape.
 * - POST /v1/auth/mfa/verify
 *     { mfaToken, code } | { mfaToken, recoveryCode } -> normal token pair.
 * - POST /v1/auth/mfa/enroll/start   (Bearer, ADMIN)
 *     -> { otpauthUri, qrDataUrl, secret }
 * - POST /v1/auth/mfa/enroll/confirm (Bearer, ADMIN)
 *     { code } -> { recoveryCodes: string[] }  (shown ONCE)
 *
 * Error codes (403 unless noted):
 * - MFA_ENROLLMENT_REQUIRED  — API requires MFA and the account has none yet.
 * - account locked after 5 consecutive failures — the error carries the wait
 *   time; the exact field is read defensively (retryAfter / lockedUntil / the
 *   `Retry-After` header).
 */

/** The login response branch that asks for a second factor. */
export interface MfaChallengeResponse {
  mfaRequired: true;
  /** Short-lived challenge token. Lives ONLY in client memory — never stored. */
  mfaToken: string;
}

/** Second-factor verification. Exactly one of `code`/`recoveryCode` is sent. */
export interface MfaVerifyRequest {
  mfaToken: string;
  /** 6-digit TOTP code. */
  code?: string;
  /** One of the 8 recovery codes. */
  recoveryCode?: string;
}

/** Enrollment start payload (the authenticator provisioning material). */
export interface MfaEnrollStartResponse {
  /** `otpauth://totp/...` URI. */
  otpauthUri: string;
  /** QR code rendered as a `data:image/...;base64,` URL. */
  qrDataUrl: string;
  /** The shared secret for manual entry (Base32). */
  secret: string;
}

/** Enrollment confirmation payload. */
export interface MfaEnrollConfirmRequest {
  /** First 6-digit TOTP code from the authenticator app. */
  code: string;
}

/** Enrollment confirmation response — the recovery codes are returned once. */
export interface MfaEnrollConfirmResponse {
  recoveryCodes: string[];
}

/** Machine-readable error code the API returns when MFA enrollment is required. */
export const MFA_ENROLLMENT_REQUIRED = "MFA_ENROLLMENT_REQUIRED";
