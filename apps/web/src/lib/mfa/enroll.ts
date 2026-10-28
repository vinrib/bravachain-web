/**
 * Defensive normalizers for the MFA enrollment responses.
 *
 * The provisioning material (secret, QR, otpauth URI) and the recovery codes
 * are sensitive: this module only reshapes them for the view — it never logs,
 * stores, or forwards them anywhere. Field names are read tolerantly because
 * the real OpenAPI could not be inspected (Swagger is prod-guarded).
 */

export interface EnrollStart {
  /** `otpauth://totp/...` URI (used to build/verify the QR if needed). */
  otpauthUri: string | null;
  /** QR as a `data:image/...` URL to render directly. */
  qrDataUrl: string | null;
  /** Shared secret for manual entry (Base32), grouped for readability. */
  secret: string | null;
}

export interface EnrollConfirm {
  recoveryCodes: string[];
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

function firstString(
  source: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

export function normalizeEnrollStart(body: unknown): EnrollStart {
  const record = asRecord(body);
  const source = asRecord(record?.data) ?? record ?? {};
  return {
    otpauthUri: firstString(source, ["otpauthUri", "otpauthUrl", "otpauth", "uri"]),
    qrDataUrl: firstString(source, [
      "qrDataUrl",
      "qrCodeDataUrl",
      "qrCode",
      "qr",
      "qrImage",
    ]),
    secret: firstString(source, ["secret", "manualKey", "sharedSecret", "base32"]),
  };
}

export function normalizeEnrollConfirm(body: unknown): EnrollConfirm {
  const record = asRecord(body);
  const source = asRecord(record?.data) ?? record ?? {};
  const raw =
    source.recoveryCodes ??
    source.recovery_codes ??
    source.backupCodes ??
    source.codes;
  const recoveryCodes = Array.isArray(raw)
    ? raw.filter((c): c is string => typeof c === "string" && c.length > 0)
    : [];
  return { recoveryCodes };
}

/**
 * Groups a Base32 secret into 4-char chunks for easier manual typing, e.g.
 * "ABCD EFGH IJKL". Purely presentational — the original value is unchanged.
 */
export function formatSecretForDisplay(secret: string | null): string | null {
  if (!secret) return null;
  return secret.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}
