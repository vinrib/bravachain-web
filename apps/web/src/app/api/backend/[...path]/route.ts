import { serverEnv } from "@/lib/env";
import {
  getAccessToken,
  getRefreshToken,
  setSession,
  clearSession,
} from "@/lib/auth/session";
import { refreshTokens } from "@/lib/auth/backend";

/**
 * Authenticated proxy: `/api/backend/<path>` → `<BACKEND_API_URL>/<path>`.
 *
 * The browser calls this route with no token in sight; the BFF attaches the
 * access token from the httpOnly cookie server-side. On a 401 it transparently
 * rotates the refresh token, updates the cookies, and retries once. This is the
 * only way the client talks to the backend for authenticated data.
 */

// Headers we never forward upstream (client cookies/auth) or back downstream.
const STRIPPED_REQUEST_HEADERS = new Set(["cookie", "authorization", "host"]);

async function buildTargetUrl(
  pathSegments: string[],
  incoming: URL,
): Promise<string> {
  const path = pathSegments.map(encodeURIComponent).join("/");
  const target = new URL(`${serverEnv.backendApiUrl}/${path}`);
  target.search = incoming.search;
  return target.toString();
}

function forwardableHeaders(request: Request): Headers {
  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  return headers;
}

async function handle(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const url = new URL(request.url);
  const target = await buildTargetUrl(path, url);

  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";
  // Buffer the body so we can safely retry the request after a token refresh.
  const bodyBuffer = hasBody ? await request.arrayBuffer() : undefined;

  const baseHeaders = forwardableHeaders(request);

  async function callBackend(accessToken: string | undefined): Promise<Response> {
    const headers = new Headers(baseHeaders);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(target, {
      method,
      headers,
      body: bodyBuffer,
      cache: "no-store",
      redirect: "manual",
    });
  }

  let accessToken = await getAccessToken();
  let upstream = await callBackend(accessToken);

  // Transparent refresh + single retry on auth failure.
  if (upstream.status === 401) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const rotated = await refreshTokens(refreshToken);
      if (rotated) {
        await setSession(rotated);
        accessToken = rotated.accessToken;
        upstream = await callBackend(accessToken);
      } else {
        await clearSession();
      }
    }
  }

  // Re-emit the upstream response with a clean header set.
  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  responseHeaders.set("cache-control", "no-store");

  const responseBody =
    upstream.status === 204 || upstream.status === 205
      ? null
      : await upstream.arrayBuffer();

  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
