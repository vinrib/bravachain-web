/**
 * Removes token fields from a backend response before it is handed to the
 * browser. Tokens live only in httpOnly cookies — they must never appear in a
 * JSON body the client-side JS can read.
 */
const TOKEN_KEYS = new Set([
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "token",
  "tokens",
]);

export function stripTokens<T>(body: T): T {
  if (!body || typeof body !== "object") return body;
  if (Array.isArray(body)) return body.map(stripTokens) as unknown as T;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (TOKEN_KEYS.has(key)) continue;
    out[key] = typeof value === "object" ? stripTokens(value) : value;
  }
  return out as T;
}
