/**
 * Pure, runtime-neutral helpers for the two-step login MFA challenge.
 *
 * The backend login (#84) may answer, instead of a token pair, with a body that
 * asks for a second factor. Because the real field names could not be confirmed
 * against the live OpenAPI (Swagger is prod-guarded), we detect the challenge
 * defensively and pull the challenge token from a few plausible aliases.
 *
 * The `mfaToken` is a short-lived challenge credential — it is returned to the
 * client so the code step can carry it, but it must live ONLY in memory
 * (component state), never in storage, a cookie, the URL, or any log.
 */

export interface MfaChallenge {
  mfaToken: string;
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

/** True when the login body is an MFA challenge rather than a token pair. */
export function isMfaChallenge(body: unknown): boolean {
  const record = asRecord(body);
  if (!record) return false;
  // Unwrap a common `{ data: {...} }` envelope.
  const source = asRecord(record.data) ?? record;
  return source.mfaRequired === true || source.mfa_required === true;
}

/**
 * Extracts the challenge token from an MFA-challenge login body, or null if the
 * body is not a challenge / carries no usable token.
 */
export function extractMfaChallenge(body: unknown): MfaChallenge | null {
  const record = asRecord(body);
  if (!record) return null;
  const source = asRecord(record.data) ?? record;
  if (source.mfaRequired !== true && source.mfa_required !== true) return null;

  const mfaToken =
    (typeof source.mfaToken === "string" && source.mfaToken) ||
    (typeof source.mfa_token === "string" && source.mfa_token) ||
    (typeof source.challengeToken === "string" && source.challengeToken) ||
    null;

  if (!mfaToken) return null;
  return { mfaToken };
}
