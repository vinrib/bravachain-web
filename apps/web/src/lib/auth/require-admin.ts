import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getAccessToken, getRefreshToken } from "./session";
import { decodeJwt } from "./jwt";

/**
 * Server-side gate for the admin area.
 *
 * Admin-ness is read from the `role` claim in the session JWT. `GET /auth/me`
 * intentionally does NOT return the role (confirmed against the backend source),
 * so decoding the token is the only server-side way to know it. We prefer the
 * access token and fall back to the refresh token (same `role`/`sub` claims)
 * because the access cookie expires with the short-lived access token while the
 * refresh cookie outlives it — without the fallback an admin would be bounced to
 * login a few minutes after signing in.
 *
 * This is a UI gate only: the token signature is NOT verified here. Real
 * authorization is enforced by the backend on every proxied admin call, and MFA
 * enrollment is enforced centrally by the `MFA_ENROLLMENT_REQUIRED` interceptor
 * in `client-api.ts` when an admin data call returns it.
 */

export interface AdminContext {
  userId: string | null;
  isAdmin: boolean;
}

function readIdentity(token: string | undefined): AdminContext | null {
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims) return null;
  const role = typeof claims.role === "string" ? claims.role.toUpperCase() : null;
  const userId = typeof claims.sub === "string" ? claims.sub : null;
  return { userId, isAdmin: role === "ADMIN" };
}

/** Loads the admin identity once per request (memoized), or null when signed out. */
export const loadAdminContext = cache(async (): Promise<AdminContext | null> => {
  const token = (await getAccessToken()) ?? (await getRefreshToken());
  return readIdentity(token);
});

/**
 * Gates the admin area. Redirects anonymous users to login and non-admins to the
 * dashboard. Returns the admin identity (including `userId`) for admins.
 */
export async function requireAdmin(nextPath = "/admin"): Promise<AdminContext> {
  const ctx = await loadAdminContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!ctx.isAdmin) redirect("/");
  return ctx;
}

/**
 * Alias kept for the page gates. MFA enrollment is no longer pre-checked here
 * (the backend `/auth/me` can't report it): an unenrolled admin is caught by the
 * central interceptor the first time a page makes an admin data call.
 */
export const requireAdminEnrolled = requireAdmin;
