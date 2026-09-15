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

const AUTH_PAGES = new Set(["/login", "/register"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  const isAuthPage = AUTH_PAGES.has(pathname);

  // Signed-out user hitting a protected page → send to login (remember target).
  if (!hasSession && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in user hitting login/register → send to dashboard.
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|.*\\.svg).*)"],
};
