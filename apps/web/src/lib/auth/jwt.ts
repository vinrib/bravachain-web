/**
 * Minimal, unverified JWT payload reader.
 *
 * The BFF does NOT verify signatures — the backend issues (RS256) and verifies
 * tokens. Here we only decode the payload to read `exp` so a cookie's lifetime
 * can track the token's. Never trust these claims for authorization.
 */
export interface JwtClaims {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: unknown;
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const withPad = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  // atob is available in both the Node and Edge runtimes.
  return atob(withPad);
}

export function decodeJwt(token: string): JwtClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1]!)) as JwtClaims;
  } catch {
    return null;
  }
}

/** Seconds until the token expires, clamped to >= 0. Null if no `exp`. */
export function secondsUntilExpiry(token: string): number | null {
  const claims = decodeJwt(token);
  if (!claims?.exp) return null;
  return Math.max(0, claims.exp - Math.floor(Date.now() / 1000));
}
