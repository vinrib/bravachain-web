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
 * Errors are forwarded with the backend `status`, a neutral `message`, and the
 * machine `code` (plus `Retry-After` when present) so the client can tell apart
 * invalid / locked / expired without this route revealing which factor failed.
 * The challenge token and factor are never logged.
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
    const headers = new Headers();
    // Preserve a lock countdown if the backend sent one on the body (the raw
    // fetch here can't read upstream headers, so callers also read the body).
    const retryAfter =
      (body as { retryAfter?: unknown } | null)?.retryAfter ??
      (body as { retryAfterSeconds?: unknown } | null)?.retryAfterSeconds;
    if (typeof retryAfter === "number" || typeof retryAfter === "string") {
      headers.set("Retry-After", String(retryAfter));
    }
    return NextResponse.json(
      { message: parsed?.message ?? "Não foi possível verificar.", code: parsed?.code },
      { status: status || 401, headers },
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
