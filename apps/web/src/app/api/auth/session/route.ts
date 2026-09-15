import { NextResponse } from "next/server";
import { hasSession } from "@/lib/auth/session";

/**
 * Lightweight session probe for client components. Returns only whether a
 * session exists — never any token. For the user profile, call
 * `/api/backend/auth/me` through the authenticated proxy.
 */
export async function GET() {
  return NextResponse.json({ authenticated: await hasSession() });
}
