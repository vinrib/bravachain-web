import { decodeJwt } from "./jwt";

/**
 * Pure identity extraction from a session JWT. Runtime-neutral (no server-only,
 * no next/headers) so it is shared by the server gate (`require-admin`) and the
 * `/api/auth/session` route, and unit-testable in isolation.
 *
 * Authorization is NOT established here — the signature is never verified. This
 * only reads the `role`/`sub` claims to decide what the UI shows; the backend
 * enforces real authorization on every admin call.
 */
export interface Identity {
  userId: string | null;
  isAdmin: boolean;
}

export function identityFromToken(token: string | null | undefined): Identity | null {
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims) return null;
  const role = typeof claims.role === "string" ? claims.role.toUpperCase() : null;
  const userId = typeof claims.sub === "string" ? claims.sub : null;
  return { userId, isAdmin: role === "ADMIN" };
}
