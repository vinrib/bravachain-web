/**
 * Client-side access to the BFF. Screens call these — never the backend
 * directly. Requests carry the httpOnly session cookie automatically; no token
 * is ever handled in client JS.
 */
import type {
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@bravachain/api-client";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Machine-readable error code from the backend body, when present. */
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<{ message: string; code?: string }> {
  const body = (await res.json().catch(() => null)) as
    | { message?: string; code?: string }
    | null;
  return {
    message: body?.message ?? res.statusText,
    code: body?.code,
  };
}

/** Authenticated call to the backend via the BFF proxy (`/api/backend/...`). */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const { message, code } = await parseError(res);
    throw new ApiError(res.status, message, code);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Calls a BFF auth route (`/api/auth/...`). */
async function authAction<T>(action: string, payload?: unknown): Promise<T> {
  const res = await fetch(`/api/auth/${action}`, {
    method: "POST",
    headers: payload ? { "Content-Type": "application/json" } : {},
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!res.ok) {
    const { message, code } = await parseError(res);
    throw new ApiError(res.status, message, code);
  }
  return res.json() as Promise<T>;
}

export function login(credentials: LoginRequest) {
  return authAction<{ ok: true; user: unknown }>("login", credentials);
}

/**
 * Requests a password-reset e-mail. Resolves for any outcome the BFF treats as
 * success (which is every outcome except rate limiting) so the UI can show a
 * single state regardless of whether the account exists. Throws `ApiError`
 * with status 429 when rate-limited.
 */
export function forgotPassword(email: string) {
  const body: ForgotPasswordRequest = { email };
  return authAction<{ ok: true }>("forgot-password", body);
}

/**
 * Completes a password reset. Throws `ApiError` — status 400 means the link is
 * invalid/expired, 429 means rate-limited. The token stays in the argument and
 * is never logged.
 */
export function resetPassword(token: string, newPassword: string) {
  const body: ResetPasswordRequest = { token, newPassword };
  return authAction<{ ok: true }>("reset-password", body);
}

export function signup(payload: Record<string, unknown>) {
  return authAction<{ ok: true; authenticated: boolean; data: unknown }>(
    "signup",
    payload,
  );
}

export function logout() {
  return authAction<{ ok: true }>("logout");
}
