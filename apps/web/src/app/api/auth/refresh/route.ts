import { NextResponse } from "next/server";
import { getRefreshToken, setSession, clearSession } from "@/lib/auth/session";
import { refreshTokens } from "@/lib/auth/backend";

/**
 * Explicit refresh endpoint. The authenticated proxy refreshes transparently on
 * 401, but this is useful for a client-triggered "keep me signed in" retry.
 */
export async function POST() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  }

  const rotated = await refreshTokens(refreshToken);
  if (!rotated) {
    await clearSession();
    return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  }

  await setSession(rotated);
  return NextResponse.json({ ok: true });
}
