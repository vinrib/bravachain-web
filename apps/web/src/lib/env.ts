import "server-only";

/**
 * Server-only environment. Never import this from a Client Component — the
 * `server-only` guard turns that into a build error, which is the whole point:
 * the backend URL and cookie config must not leak into client bundles.
 */

const rawBackendUrl =
  process.env.BACKEND_API_URL ??
  "https://bravachain-api-production.up.railway.app";

export const serverEnv = {
  /** Base URL of the NestJS backend (no trailing slash). */
  backendApiUrl: rawBackendUrl.replace(/\/+$/, ""),
  isProduction: process.env.NODE_ENV === "production",
} as const;
