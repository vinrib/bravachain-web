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
