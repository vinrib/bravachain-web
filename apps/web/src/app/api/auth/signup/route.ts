import { NextResponse } from "next/server";
import { backendSignup, extractTokens } from "@/lib/auth/backend";
import { setSession } from "@/lib/auth/session";
import { stripTokens } from "@/lib/auth/sanitize";

/**
 * BFF signup. Registers the cooperative against the backend. If the backend
 * returns tokens (auto-login), they are stored in httpOnly cookies. The
 * response body (minus any tokens) is passed through so the client can act on
 * onboarding data such as Avenia KYC/KYB links.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { ok, status, body } = await backendSignup(payload);

  if (!ok) {
    const message =
      (body as { message?: string } | null)?.message ?? "Não foi possível criar a conta.";
    return NextResponse.json({ message }, { status: status || 400 });
  }

  const tokens = extractTokens(body);
  if (tokens) {
    await setSession(tokens);
  }

  return NextResponse.json(
    { ok: true, authenticated: Boolean(tokens), data: stripTokens(body) },
    { status: 201 },
  );
}
