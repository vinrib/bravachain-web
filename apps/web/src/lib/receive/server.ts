import "server-only";
import { endpoints } from "@bravachain/api-client";
import { serverEnv } from "@/lib/env";
import type { PublicInstructions } from "./types";

/**
 * Server-side fetch for the PUBLIC share link (no auth). Keeps the backend URL
 * off the client. Returns a discriminated result so the page can render the
 * right state without leaking internals.
 */
export type PublicInstructionsResult =
  | { kind: "ok"; data: PublicInstructions }
  | { kind: "not_found" }
  | { kind: "expired" }
  | { kind: "error" };

export async function getPublicInstructions(
  shareToken: string,
): Promise<PublicInstructionsResult> {
  let res: Response;
  try {
    res = await fetch(`${serverEnv.backendApiUrl}${endpoints.receive.pay(shareToken)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return { kind: "error" };
  }

  if (res.status === 404) return { kind: "not_found" };
  if (res.status === 410) return { kind: "expired" };
  if (!res.ok) return { kind: "error" };

  const data = (await res.json().catch(() => null)) as PublicInstructions | null;
  if (!data) return { kind: "error" };
  return { kind: "ok", data };
}
