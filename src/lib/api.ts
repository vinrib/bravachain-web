const BASE_URL = "https://bravachain-api-production.up.railway.app";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bravachain_token");
}

export function setToken(token: string): void {
  localStorage.setItem("bravachain_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("bravachain_token");
}

export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${BASE_URL}${path}`, { ...options, headers });
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await authFetch(path, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "API error");
  }
  return res.json() as Promise<T>;
}
