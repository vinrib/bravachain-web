import { NextResponse } from "next/server";
import { getAccessToken, clearSession } from "@/lib/auth/session";
import { backendLogout } from "@/lib/auth/backend";

/** Revokes the session server-side (best effort) and clears cookies. */
export async function POST() {
  const accessToken = await getAccessToken();
  if (accessToken) {
    await backendLogout(accessToken);
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
