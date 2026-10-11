/**
 * Manual request/response types for auth endpoints that exist on the backend
 * (main @ 8c74ac1, in production) but are NOT yet present in the committed
 * `openapi.json`. Swagger is prod-guarded on every deployed backend, so the
 * spec can't be regenerated from a live doc here, and `openapi.json` must not
 * be hand-edited.
 *
 * Remove this file once the backend's OpenAPI is regenerated (via its own
 * `scripts/generate-openapi.ts`) and `openapi.json` + `generated/schema.ts`
 * include these routes.
 *
 * Contracts (confirmed with the backend team):
 * - POST /v1/auth/login            { email, password, rememberMe? } -> 200
 * - POST /v1/auth/forgot-password  { email }                        -> 200 always (never reveals account existence); 429 when rate-limited
 * - POST /v1/auth/reset-password   { token, newPassword }           -> 200; 401 when the token is invalid/expired/used
 */

export interface LoginRequest {
  email: string;
  password: string;
  /** When true, the backend issues a longer-lived session. */
  rememberMe?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  /** Minimum 8 characters (also enforced by the backend). */
  newPassword: string;
}

/** The generic `{ message }` envelope these auth endpoints return. */
export interface AuthMessageResponse {
  message: string;
}
