"use client";

import { useCallback, useEffect, useState } from "react";
import { endpoints, MFA_ENROLLMENT_REQUIRED } from "@bravachain/api-client";
import { apiFetch, ApiError } from "@/lib/client-api";
import {
  normalizeBalance,
  normalizeTransactions,
  normalizeKycState,
  type Balance,
  type Transaction,
  type KycState,
} from "@/lib/models";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Generic data hook: fetches on mount, exposes `reload`. */
function useResource<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    // Reset to the loading state each time we (re)fetch; intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Falha ao carregar dados.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  return { data, loading, error, reload };
}

export function useBalance(): AsyncState<Balance> {
  return useResource(
    () => apiFetch(endpoints.wallet.balance).then(normalizeBalance),
    [],
  );
}

export function useTransactions(): AsyncState<Transaction[]> {
  return useResource(
    () => apiFetch(endpoints.wallet.history).then(normalizeTransactions),
    [],
  );
}

export function useKycState(): AsyncState<KycState> {
  return useResource(
    () => apiFetch(endpoints.kyc.status).then(normalizeKycState),
    [],
  );
}

export interface Me {
  name: string | null;
  email: string | null;
}

/** The signed-in company profile (GET /auth/me). Name is the company name. */
export function useMe(): AsyncState<Me> {
  return useResource(
    () =>
      apiFetch<{ name?: string; email?: string }>(endpoints.auth.me).then((r) => ({
        name: typeof r?.name === "string" ? r.name : null,
        email: typeof r?.email === "string" ? r.email : null,
      })),
    [],
  );
}

function bodyIsAdmin(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  const source =
    (record.user as Record<string, unknown> | undefined) ??
    (record.data as Record<string, unknown> | undefined) ??
    record;
  if (source.isAdmin === true) return true;
  const role = source.role;
  if (typeof role === "string" && role.toUpperCase() === "ADMIN") return true;
  const roles = source.roles;
  return (
    Array.isArray(roles) &&
    roles.some((r) => typeof r === "string" && r.toUpperCase() === "ADMIN")
  );
}

/**
 * Whether the signed-in user is an admin, for toggling the admin entry point in
 * the client nav. Only ever reveals the admin link to admins. A 403
 * `MFA_ENROLLMENT_REQUIRED` (admin under enforcement, not yet enrolled) also
 * counts as admin so the link stays reachable. Any other failure → not admin.
 */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let active = true;
    apiFetch<unknown>(endpoints.auth.me)
      .then((body) => {
        if (active) setIsAdmin(bodyIsAdmin(body));
      })
      .catch((err) => {
        if (active && err instanceof ApiError && err.code === MFA_ENROLLMENT_REQUIRED) {
          setIsAdmin(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  return isAdmin;
}
