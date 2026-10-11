import { NextResponse } from "next/server";
import { backendResetPassword } from "@/lib/auth/backend";

/**
 * BFF: complete a password reset.
 *
 * Security:
 * - The reset token and the new password are secrets; neither is ever logged.
 * - Error responses are generic. We collapse every failure mode the backend
 *   can return for a bad token (400/401/404/410) into a single "invalid link"
 *   reason, so timing/wording can't be used to probe token state.
 */
export async function POST(request: Request) {
  let token = "";
  let newPassword = "";
  try {
    const body = (await request.json()) as {
      token?: unknown;
      newPassword?: unknown;
    };
    if (typeof body?.token === "string") token = body.token;
    if (typeof body?.newPassword === "string") newPassword = body.newPassword;
  } catch {
    return NextResponse.json(
      { message: "Requisição inválida.", reason: "invalid" },
      { status: 400 },
    );
  }

  // Validate server-side too — never trust the client's checks.
  if (!token || newPassword.length < 8) {
    return NextResponse.json(
      { message: "Link inválido ou expirado.", reason: "invalid" },
      { status: 400 },
    );
  }

  const { status } = await backendResetPassword(token, newPassword);

  if (status === 200 || status === 201 || status === 204) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (status === 429) {
    return NextResponse.json(
      { message: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 },
    );
  }

  // Any other failure (400/401/404/410/5xx) → generic invalid-link response.
  return NextResponse.json(
    { message: "Link inválido ou expirado.", reason: "invalid" },
    { status: 400 },
  );
}
