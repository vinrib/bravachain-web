import { NextResponse } from "next/server";
import { backendLogin, extractTokens } from "@/lib/auth/backend";
import { setSession } from "@/lib/auth/session";
import { stripTokens } from "@/lib/auth/sanitize";

/**
 * BFF login. Accepts credentials, authenticates against the backend, and stores
 * the returned tokens in httpOnly cookies. No token is ever returned to the client.
 */
export async function POST(request: Request) {
  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ message: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { ok, status, body } = await backendLogin(credentials);

  if (!ok) {
    const message =
      (body as { message?: string } | null)?.message ?? "Credenciais inválidas.";
    return NextResponse.json({ message }, { status: status || 401 });
  }

  const tokens = extractTokens(body);
  if (!tokens) {
    // Backend accepted the login but we could not locate tokens in the response.
    // This is the field-name reconciliation point — see extractTokens.
    return NextResponse.json(
      { message: "Resposta de autenticação inesperada do servidor." },
      { status: 502 },
    );
  }

  await setSession(tokens);
  return NextResponse.json({ ok: true, user: stripTokens(body) }, { status: 200 });
}
