import "server-only";

/**
 * Server-only environment. Never import this from a Client Component — the
 * `server-only` guard turns that into a build error, which is the whole point:
 * the backend URL and cookie config must not leak into client bundles.
 */

/**
 * Resolves the backend base URL (no trailing slash).
 *
 * There is intentionally no hardcoded production fallback: a missing URL must
 * fail loudly instead of silently pointing a real deployment at the wrong host.
 * - Production: `BACKEND_API_URL` is required — an absent/blank value throws,
 *   which fails the build/start.
 * - Local dev: falls back to `http://localhost:3000`.
 */
function resolveBackendApiUrl(): string {
  const raw = process.env.BACKEND_API_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BACKEND_API_URL não está definida. Em produção a URL da API é " +
        "obrigatória — defina BACKEND_API_URL (ex.: https://api.exemplo.com) " +
        "no ambiente do build/deploy.",
    );
  }

  return "http://localhost:3000";
}

export const serverEnv = {
  /** Base URL of the NestJS backend (no trailing slash). */
  backendApiUrl: resolveBackendApiUrl(),
  isProduction: process.env.NODE_ENV === "production",
} as const;
