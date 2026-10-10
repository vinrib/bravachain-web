import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookie-names";

/**
 * Optimistic route protection (Next.js 16 renamed Middleware → Proxy).
 *
 * This is a cheap redirect guard based only on cookie presence — NOT the
 * authorization boundary. Real enforcement happens at the backend on every
 * proxied call. See docs/app/guides/authentication#optimistic-checks.
 */

// Pages reachable without a session. forgot/reset-password must be here so the
// guard below doesn't bounce signed-out users to /login.
const PUBLIC_PAGES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

// Public pages a signed-in user has no reason to see → bounce to the dashboard.
// `/reset-password` is intentionally excluded: a logged-in user who clicks a
// reset link (e.g. from another device) should still be able to complete it.
const REDIRECT_WHEN_AUTHED = new Set(["/login", "/register", "/forgot-password"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);

  // Signed-out user hitting a protected page → send to login (remember target).
  if (!hasSession && !PUBLIC_PAGES.has(pathname)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in user hitting a pre-auth page → send to dashboard.
  if (hasSession && REDIRECT_WHEN_AUTHED.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|.*\\.svg).*)"],
};
