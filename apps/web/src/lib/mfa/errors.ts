/**
 * Classifies a failed MFA-verify response for the two-step login.
 *
 * Confirmed against the backend source: `POST /v1/auth/mfa/verify` returns a
 * SINGLE generic 401 for EVERY failure — wrong/expired/reused TOTP code, wrong
 * recovery code, a locked account (5 attempts → 15 min), or an unknown user. It
 * never reveals which factor failed, whether the account is locked, or any wait
 * time (no machine code, no `Retry-After`). So the UI cannot — and must not —
 * distinguish "locked" or "expired": any verify failure is a single neutral
 * "could not verify" state. A rate-limit (429) gets its own neutral message.
 *
 * (Web 1 shipped speculative `locked`-countdown / `expired`→step-1 handling
 * before the spec was visible; this is the corrected, honest model.)
 */

export type MfaVerifyErrorKind = "invalid" | "generic";

export interface MfaVerifyError {
  kind: MfaVerifyErrorKind;
}

export interface MfaVerifyErrorInput {
  status?: number | null;
  code?: string | null;
}

export function mapMfaVerifyError(input: MfaVerifyErrorInput): MfaVerifyError {
  const status = input.status ?? 0;
  // A wrong/expired/locked second factor all come back as 4xx with no detail.
  if (status >= 400 && status < 500) return { kind: "invalid" };
  return { kind: "generic" };
}
