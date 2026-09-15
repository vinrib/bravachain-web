import "server-only";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";
import { secondsUntilExpiry } from "./jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./cookie-names";

/**
 * Session storage for the BFF pattern.
 *
 * Both tokens live in httpOnly cookies so client-side JS can never read them.
 * The browser sends them automatically; only the Next.js server (Route
 * Handlers / Server Components / proxy) can access their values.
 */

// Fallback lifetimes used only when a token has no decodable `exp`.
const ACCESS_FALLBACK_MAX_AGE = 60 * 15; // 15 min
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: serverEnv.isProduction,
    sameSite: "lax" as const,
    path: "/",
  };
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** Writes both tokens to httpOnly cookies. Call from a Route Handler. */
export async function setSession({
  accessToken,
  refreshToken,
}: SessionTokens): Promise<void> {
  const store = await cookies();
  const accessMaxAge = secondsUntilExpiry(accessToken) ?? ACCESS_FALLBACK_MAX_AGE;

  store.set(ACCESS_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: accessMaxAge,
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: REFRESH_MAX_AGE,
  });
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

/** Clears the session. Call from the logout Route Handler. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/**
 * Optimistic auth check for Server Components. Presence of a refresh token is
 * enough to attempt requests; real authorization is enforced by the backend on
 * every proxied call.
 */
export async function hasSession(): Promise<boolean> {
  const store = await cookies();
  return store.has(ACCESS_COOKIE) || store.has(REFRESH_COOKIE);
}

export const sessionCookieNames = {
  access: ACCESS_COOKIE,
  refresh: REFRESH_COOKIE,
} as const;
