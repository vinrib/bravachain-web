import { NextResponse } from "next/server";
import { backendMfaVerify, extractTokens } from "@/lib/auth/backend";
import { setSession } from "@/lib/auth/session";
import { stripTokens } from "@/lib/auth/sanitize";

/**
 * BFF second-factor verification. Takes `{ mfaToken, code }` or
 * `{ mfaToken, recoveryCode }`, verifies against the backend, and on success
 * stores the returned tokens in httpOnly cookies — the same session path as
 * login. No token is ever returned to the client.
 *
 * Errors are forwarded with the backend `status` and its neutral `message`. The
 * backend intentionally returns one opaque failure for every bad/expired/locked
 * factor, so there is nothing more to classify here. The challenge token and the
 * factor are never logged.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { ok, status, body } = await backendMfaVerify(payload);

  if (!ok) {
    const parsed = body as { message?: string; code?: string } | null;
    return NextResponse.json(
      { message: parsed?.message ?? "Não foi possível verificar.", code: parsed?.code },
      { status: status || 401 },
    );
  }

  const tokens = extractTokens(body);
  if (!tokens) {
    return NextResponse.json(
      { message: "Resposta de autenticação inesperada do servidor." },
      { status: 502 },
    );
  }

  await setSession(tokens);
  return NextResponse.json({ ok: true, user: stripTokens(body) }, { status: 200 });
}
