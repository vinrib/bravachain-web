import { NextResponse } from "next/server";
import { backendForgotPassword } from "@/lib/auth/backend";

/**
 * BFF: request a password-reset e-mail.
 *
 * Privacy contract: the response to the client is ALWAYS a uniform success,
 * whether or not the e-mail belongs to a real account. We never surface the
 * backend's outcome (beyond the dedicated rate-limit signal), so the client
 * cannot be used to enumerate accounts. The e-mail is not logged.
 */
export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body?.email === "string") email = body.email.trim();
  } catch {
    // Malformed body → still answer with the same uniform success below.
  }

  // Only hit the backend when there is something that looks like an e-mail.
  // A missing/blank e-mail yields the same success response, revealing nothing.
  if (email) {
    const { status } = await backendForgotPassword(email);
    // Surface rate limiting so the UI can ask the user to wait — this leaks no
    // account information (it is keyed on request volume, not on the address).
    if (status === 429) {
      return NextResponse.json(
        { message: "Muitas solicitações. Tente novamente em alguns minutos." },
        { status: 429 },
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
