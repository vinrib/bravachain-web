"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearPtaxHistoryCacheKey,
  clearPtaxMonthlyCacheKey,
  fetchPtaxConvert,
  fetchPtaxHistory,
  fetchPtaxLatest,
  fetchPtaxMonthlyAverage,
  getCachedPtaxHistory,
  getCachedPtaxMonthlyAverage,
  isPtaxFeatureDisabledError,
  mapPtaxErrorToMessage,
} from "./api";
import {
  PTAX_CONVERT_DEBOUNCE_MS,
  PTAX_LATEST_POLL_MS,
  PTAX_UI_CURRENCIES,
  type PtaxConvertCurrency,
  type PtaxPeriod,
  type PtaxUiCurrency,
} from "./constants";
import { PTAX_COPY } from "./copy";
import { normalizeCalculatorAmount } from "./format";
import type {
  PtaxConvertResponse,
  PtaxHistoryResponse,
  PtaxLatestResponse,
  PtaxMonthlyAverageResponse,
} from "./types";

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

/**
 * Fetches `/v1/ptax/latest` on mount, polls every 60s while the tab is visible,
 * pauses when hidden, and refreshes when focus/visibility returns.
 * Never executes during SSR.
 */
export function usePtaxLatest() {
  const [data, setData] = useState<PtaxLatestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let active = true;
    let currentController: AbortController | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const load = () => {
      currentController?.abort();
      const controller = new AbortController();
      currentController = controller;

      fetchPtaxLatest(PTAX_UI_CURRENCIES, controller.signal)
        .then((res) => {
          if (!active || controller.signal.aborted) return;
          setData(res);
          setError(null);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (!active || controller.signal.aborted || isAbortError(err)) return;
          setError(mapPtaxErrorToMessage(err));
          setLoading(false);
        });
    };

    const startPolling = () => {
      if (pollTimer !== null) return;
      pollTimer = setInterval(() => {
        if (!document.hidden) {
          load();
        }
      }, PTAX_LATEST_POLL_MS);
    };

    const stopPolling = () => {
      if (pollTimer !== null) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        load();
        startPolling();
      }
    };

    const handleFocus = () => {
      if (!document.hidden) {
        load();
      }
    };

    load();
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      currentController?.abort();
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [reloadNonce]);

  return { data, loading, error, reload };
}

interface AsyncResultState<T> {
  requestKey: string;
  data: T | null;
  error: string | null;
}

/**
 * Fetches `/v1/ptax/history?currency&period` with client-side key caching and
 * `AbortController` cancellation on currency/period changes.
 */
export function usePtaxHistory(
  currency: PtaxUiCurrency,
  period: PtaxPeriod,
  enabled: boolean,
) {
  const [reloadNonce, setReloadNonce] = useState(0);
  const [result, setResult] = useState<AsyncResultState<PtaxHistoryResponse>>({
    requestKey: "",
    data: null,
    error: null,
  });

  const requestKey = `${currency}:${period}:${reloadNonce}`;
  const force = reloadNonce > 0;
  const cached =
    enabled && !force ? getCachedPtaxHistory(currency, period) : null;

  const reload = useCallback(() => {
    clearPtaxHistoryCacheKey(currency, period);
    setReloadNonce((n) => n + 1);
  }, [currency, period]);

  useEffect(() => {
    if (!enabled || cached) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    fetchPtaxHistory(currency, period, {
      signal: controller.signal,
      force,
    })
      .then((res) => {
        if (!active || controller.signal.aborted) return;
        setResult({ requestKey, data: res, error: null });
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted || isAbortError(err)) return;
        setResult({
          requestKey,
          data: null,
          error: mapPtaxErrorToMessage(err),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [currency, period, enabled, force, cached, requestKey]);

  const settled = result.requestKey === requestKey;
  const data = cached ?? (settled ? result.data : null);
  const error = cached ? null : settled ? result.error : null;
  const loading = enabled && !cached && !settled;

  return { data, loading, error, reload };
}

/**
 * Fetches `/v1/ptax/monthly-average?currency&months=12` once per currency with
 * 10-minute client-side cache and `AbortController`.
 */
export function usePtaxMonthlyAverage(currency: PtaxUiCurrency) {
  const [reloadNonce, setReloadNonce] = useState(0);
  const [result, setResult] = useState<
    AsyncResultState<PtaxMonthlyAverageResponse>
  >({
    requestKey: "",
    data: null,
    error: null,
  });

  const requestKey = `${currency}:12:${reloadNonce}`;
  const force = reloadNonce > 0;
  const cached = !force ? getCachedPtaxMonthlyAverage(currency, 12) : null;

  const reload = useCallback(() => {
    clearPtaxMonthlyCacheKey(currency, 12);
    setReloadNonce((n) => n + 1);
  }, [currency]);

  useEffect(() => {
    if (cached) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    fetchPtaxMonthlyAverage(currency, 12, {
      signal: controller.signal,
      force,
    })
      .then((res) => {
        if (!active || controller.signal.aborted) return;
        setResult({ requestKey, data: res, error: null });
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted || isAbortError(err)) return;
        setResult({
          requestKey,
          data: null,
          error: mapPtaxErrorToMessage(err),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [currency, force, cached, requestKey]);

  const settled = result.requestKey === requestKey;
  const data = cached ?? (settled ? result.data : null);
  const error = cached ? null : settled ? result.error : null;
  const loading = !cached && !settled;

  return { data, loading, error, reload };
}

/**
 * Debounced (400ms) `/v1/ptax/convert` hook with `AbortController`.
 * Automatically sets `featureDisabled = true` if the server returns 404 `{ code: 'feature_disabled' }`.
 * Never multiplies values on the client.
 */
export function usePtaxConvert(
  from: PtaxConvertCurrency,
  to: PtaxConvertCurrency,
  rawAmount: string,
  enabled: boolean,
) {
  const [result, setResult] = useState<AsyncResultState<PtaxConvertResponse>>({
    requestKey: "",
    data: null,
    error: null,
  });
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const featureDisabledRef = useRef(false);

  const normalized = normalizeCalculatorAmount(rawAmount);
  const validAmount =
    normalized.status === "valid" ? normalized.normalized : "";
  const canFetch =
    enabled && !featureDisabled && from !== to && normalized.status === "valid";
  const requestKey = `${from}:${to}:${validAmount}:${reloadNonce}`;

  const reload = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!canFetch || featureDisabledRef.current) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    const timer = setTimeout(() => {
      fetchPtaxConvert(from, to, validAmount, controller.signal)
        .then((res) => {
          if (!active || controller.signal.aborted) return;
          setResult({ requestKey, data: res, error: null });
        })
        .catch((err: unknown) => {
          if (!active || controller.signal.aborted || isAbortError(err)) return;
          if (isPtaxFeatureDisabledError(err)) {
            featureDisabledRef.current = true;
            setFeatureDisabled(true);
            setResult({ requestKey, data: null, error: null });
            return;
          }
          const mapped = mapPtaxErrorToMessage(err);
          setResult({
            requestKey,
            data: null,
            error:
              mapped === PTAX_COPY.errors.generic
                ? PTAX_COPY.calculator.errorMessage
                : mapped,
          });
        });
    }, PTAX_CONVERT_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [canFetch, from, to, validAmount, requestKey]);

  const settled = result.requestKey === requestKey;
  const data = canFetch && settled ? result.data : null;
  const error = canFetch && settled ? result.error : null;
  const loading = canFetch && !settled;

  return {
    data,
    loading,
    error,
    featureDisabled,
    inputStatus: normalized.status,
    reload,
  };
}
