import { NextResponse } from "next/server";
import {
  hasSession,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/session";
import { decodeJwt } from "@/lib/auth/jwt";

/**
 * Lightweight session probe for client components. Returns whether a session
 * exists plus the user's id and whether they are an admin — both read from the
 * session JWT's `role`/`sub` claims (never a token). Used to toggle the admin
 * entry point and to identify "me" in the review screen. For the user profile,
 * call `/api/backend/auth/me` through the authenticated proxy.
 */
export async function GET() {
  const authenticated = await hasSession();
  const token = (await getAccessToken()) ?? (await getRefreshToken());
  const claims = token ? decodeJwt(token) : null;
  const role = typeof claims?.role === "string" ? claims.role.toUpperCase() : null;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  return NextResponse.json({
    authenticated,
    isAdmin: authenticated && role === "ADMIN",
    userId: authenticated ? userId : null,
  });
}
