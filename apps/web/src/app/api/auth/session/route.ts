import { NextResponse } from "next/server";
import {
  hasSession,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/session";
import { identityFromToken } from "@/lib/auth/role";

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
  const identity = identityFromToken(token);
  return NextResponse.json({
    authenticated,
    isAdmin: authenticated && (identity?.isAdmin ?? false),
    userId: authenticated ? (identity?.userId ?? null) : null,
  });
}
