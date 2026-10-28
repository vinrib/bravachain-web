/**
 * Maps the backend's MFA-verify failures to how the two-step login should
 * react. The classification is intentionally coarse and generic: the UI must
 * never reveal whether the user exists or which factor failed, so an invalid
 * 6-digit code and an invalid recovery code both resolve to the same "invalid"
 * kind and the same neutral message.
 *
 * Because the real error bodies could not be confirmed against the live OpenAPI
 * (Swagger is prod-guarded), detection is defensive: we match on a few plausible
 * machine codes, then fall back to HTTP status.
 *
 * Kinds:
 * - "expired"  — the mfaToken is no longer valid; the UI returns to step 1.
 * - "locked"   — too many consecutive failures; show the remaining wait time.
 * - "invalid"  — wrong code / recovery code; let the user try again.
 * - "generic"  — anything else; neutral retry message.
 */

export type MfaVerifyErrorKind = "expired" | "locked" | "invalid" | "generic";

export interface MfaVerifyError {
  kind: MfaVerifyErrorKind;
  /** Seconds the account stays locked, when known (kind === "locked"). */
  retryAfterSeconds?: number;
}

export interface MfaVerifyErrorInput {
  status?: number | null;
  code?: string | null;
  /** Value of the HTTP `Retry-After` header, if the caller forwarded it. */
  retryAfterHeader?: string | null;
  /** The (already parsed) error body, used only to read a lock duration. */
  body?: unknown;
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

/** Best-effort seconds-until-unlock from a variety of plausible shapes. */
export function extractRetryAfterSeconds(
  input: Pick<MfaVerifyErrorInput, "retryAfterHeader" | "body">,
  now: Date = new Date(),
): number | undefined {
  const header = input.retryAfterHeader?.trim();
  if (header) {
    const asNumber = Number(header);
    if (Number.isFinite(asNumber) && asNumber > 0) return Math.ceil(asNumber);
    const asDate = Date.parse(header);
    if (!Number.isNaN(asDate)) {
      const secs = Math.ceil((asDate - now.getTime()) / 1000);
      if (secs > 0) return secs;
    }
  }

  const record = asRecord(input.body);
  const source = asRecord(record?.data) ?? record;
  if (source) {
    for (const key of [
      "retryAfterSeconds",
      "retry_after_seconds",
      "retryAfter",
      "retry_after",
      "lockedForSeconds",
      "secondsRemaining",
    ]) {
      const value = source[key];
      if (typeof value === "number" && value > 0) return Math.ceil(value);
      if (typeof value === "string") {
        const asNumber = Number(value);
        if (Number.isFinite(asNumber) && asNumber > 0) return Math.ceil(asNumber);
      }
    }
    // Absolute unlock timestamp.
    for (const key of ["lockedUntil", "locked_until", "lockUntil"]) {
      const value = source[key];
      if (typeof value === "string" || typeof value === "number") {
        const ts = typeof value === "number" ? value : Date.parse(value);
        if (!Number.isNaN(ts)) {
          const secs = Math.ceil((ts - now.getTime()) / 1000);
          if (secs > 0) return secs;
        }
      }
    }
  }
  return undefined;
}

export function mapMfaVerifyError(
  input: MfaVerifyErrorInput,
  now: Date = new Date(),
): MfaVerifyError {
  const code = input.code?.toUpperCase() ?? "";
  const status = input.status ?? 0;

  const matches = (re: RegExp) => re.test(code);

  // Expired / consumed challenge → back to step 1.
  if (matches(/EXPIR|MFA_TOKEN_INVALID|CHALLENGE_(EXPIRED|INVALID|NOT_FOUND)/)) {
    return { kind: "expired" };
  }

  // Locked after repeated failures → surface the wait time.
  if (
    matches(/LOCK|TOO_MANY|RATE_?LIMIT|ATTEMPTS/) ||
    status === 423 ||
    status === 429
  ) {
    const retryAfterSeconds = extractRetryAfterSeconds(input, now);
    return { kind: "locked", retryAfterSeconds };
  }

  // Wrong code / recovery code.
  if (status === 400 || status === 401 || status === 403 || matches(/INVALID|MFA/)) {
    return { kind: "invalid" };
  }

  return { kind: "generic" };
}

/**
 * Formats a remaining-lock duration as a compact pt-BR-friendly string, e.g.
 * "5 min", "90 s", "1 h 2 min". Returned to the UI so the lock message can
 * interpolate it via i18n without each caller re-deriving the math.
 */
export function formatLockWait(totalSeconds: number | undefined): string | null {
  if (!totalSeconds || totalSeconds <= 0) return null;
  const seconds = Math.ceil(totalSeconds);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes === 0 ? `${hours} h` : `${hours} h ${remMinutes} min`;
}
