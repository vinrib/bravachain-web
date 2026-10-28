"use client";

import { useCallback, useEffect, useState } from "react";
import { endpoints } from "@bravachain/api-client";
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

export interface AdminIdentity {
  /** The signed-in user's id, used to identify "me" in admin screens. */
  userId: string | null;
  isAdmin: boolean;
  loading: boolean;
}

/**
 * Reads `{ isAdmin, userId }` from the BFF session probe (`/api/auth/session`),
 * which decodes them from the session JWT server-side — `GET /auth/me` does not
 * return the role. Only ever reveals admin status to admins.
 */
export function useAdminIdentity(): AdminIdentity {
  const [state, setState] = useState<AdminIdentity>({
    userId: null,
    isAdmin: false,
    loading: true,
  });
  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { isAdmin?: boolean; userId?: string | null } | null) => {
        if (!active) return;
        setState({
          userId: typeof body?.userId === "string" ? body.userId : null,
          isAdmin: body?.isAdmin === true,
          loading: false,
        });
      })
      .catch(() => {
        if (active) setState({ userId: null, isAdmin: false, loading: false });
      });
    return () => {
      active = false;
    };
  }, []);
  return state;
}

/** Whether the signed-in user is an admin, for toggling the admin nav entry. */
export function useIsAdmin(): boolean {
  return useAdminIdentity().isAdmin;
}
