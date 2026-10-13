import { serverEnv } from "@/lib/env";
import { endpoints } from "@bravachain/api-client";

/**
 * Public PDF proxy for the share link. Keeps the backend URL off the client.
 * No auth — the shareToken is the capability.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ shareToken: string }> },
): Promise<Response> {
  const { shareToken } = await ctx.params;

  let upstream: Response;
  try {
    upstream = await fetch(
      `${serverEnv.backendApiUrl}${endpoints.receive.payPdf(shareToken)}`,
      { cache: "no-store" },
    );
  } catch {
    return new Response(null, { status: 502 });
  }

  if (!upstream.ok) return new Response(null, { status: upstream.status });

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/pdf",
      "content-disposition": `inline; filename="instrucoes-${shareToken}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
