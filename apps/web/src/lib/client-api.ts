/**
 * Client-side access to the BFF. Screens call these — never the backend
 * directly. Requests carry the httpOnly session cookie automatically; no token
 * is ever handled in client JS.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return (body as { message?: string } | null)?.message ?? res.statusText;
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

  if (!res.ok) throw new ApiError(res.status, await parseError(res));
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
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  return res.json() as Promise<T>;
}

export function login(credentials: { email: string; password: string }) {
  return authAction<{ ok: true; user: unknown }>("login", credentials);
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
