import { ApiError, apiFetch } from "@/lib/client-api";
import {
  PTAX_HISTORY_CACHE_TTL_MS,
  PTAX_MONTHLY_CACHE_TTL_MS,
  PTAX_UI_CURRENCIES,
  type PtaxConvertCurrency,
  type PtaxPeriod,
  type PtaxUiCurrency,
} from "./constants";
import { PTAX_COPY } from "./copy";
import type {
  PtaxConvertResponse,
  PtaxHistoryResponse,
  PtaxLatestResponse,
  PtaxMonthlyAverageResponse,
} from "./types";
import {
  PtaxValidationError,
  parsePtaxConvertResponse,
  parsePtaxHistoryResponse,
  parsePtaxLatestResponse,
  parsePtaxMonthlyAverageResponse,
} from "./validate";

interface CacheEntry<T> {
  expiresAt: number;
  data: T;
}

// Client-only in-memory caches (never populated during SSR).
const historyCache = new Map<string, CacheEntry<PtaxHistoryResponse>>();
const monthlyCache = new Map<string, CacheEntry<PtaxMonthlyAverageResponse>>();
const inflightHistory = new Map<string, Promise<PtaxHistoryResponse>>();
const inflightMonthly = new Map<string, Promise<PtaxMonthlyAverageResponse>>();
let inflightLatest: Promise<PtaxLatestResponse> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Clears all client-side PTAX caches (intended for unit tests and manual retries). */
export function clearPtaxClientCache(): void {
  historyCache.clear();
  monthlyCache.clear();
  inflightHistory.clear();
  inflightMonthly.clear();
  inflightLatest = null;
}

export function clearPtaxHistoryCacheKey(
  currency: PtaxUiCurrency,
  period: PtaxPeriod,
): void {
  historyCache.delete(`${currency}:${period}`);
}

export function clearPtaxMonthlyCacheKey(
  currency: PtaxUiCurrency,
  months = 12,
): void {
  monthlyCache.delete(`${currency}:${months}`);
}

/** True when the backend responded 404 { code: "feature_disabled" }. */
export function isPtaxFeatureDisabledError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    err.status === 404 &&
    err.code === "feature_disabled"
  );
}

/** Maps API / network / validation errors to safe pt-BR copy (including 429 & 5xx). */
export function mapPtaxErrorToMessage(err: unknown): string {
  if (err instanceof PtaxValidationError) {
    return PTAX_COPY.errors.invalidPayload;
  }
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return PTAX_COPY.errors.rateLimited;
    }
    if (err.status >= 500) {
      return PTAX_COPY.errors.serverUnavailable;
    }
  }
  return PTAX_COPY.errors.generic;
}

export async function fetchPtaxLatest(
  currencies: readonly PtaxUiCurrency[] = PTAX_UI_CURRENCIES,
  signal?: AbortSignal,
): Promise<PtaxLatestResponse> {
  const query = encodeURIComponent(currencies.join(","));
  const path = `/v1/ptax/latest?currencies=${query}`;

  if (!signal && inflightLatest) {
    return inflightLatest;
  }

  const req = apiFetch<unknown>(path, { signal }).then(parsePtaxLatestResponse);
  if (!signal) {
    inflightLatest = req;
    req.finally(() => {
      if (inflightLatest === req) inflightLatest = null;
    });
  }
  return req;
}

export function getCachedPtaxHistory(
  currency: PtaxUiCurrency,
  period: PtaxPeriod,
  nowMs: number = Date.now(),
): PtaxHistoryResponse | null {
  if (!isBrowser()) return null;
  const key = `${currency}:${period}`;
  const entry = historyCache.get(key);
  if (entry && entry.expiresAt > nowMs) {
    return entry.data;
  }
  if (entry) {
    historyCache.delete(key);
  }
  return null;
}

export async function fetchPtaxHistory(
  currency: PtaxUiCurrency,
  period: PtaxPeriod,
  options: { signal?: AbortSignal; force?: boolean } = {},
): Promise<PtaxHistoryResponse> {
  const key = `${currency}:${period}`;
  if (!options.force) {
    const cached = getCachedPtaxHistory(currency, period);
    if (cached) return cached;
  }

  if (!options.signal && !options.force) {
    const pending = inflightHistory.get(key);
    if (pending) return pending;
  }

  const path = `/v1/ptax/history?currency=${encodeURIComponent(currency)}&period=${encodeURIComponent(period)}`;
  const req = apiFetch<unknown>(path, { signal: options.signal }).then(
    (raw) => {
      const parsed = parsePtaxHistoryResponse(raw);
      if (isBrowser()) {
        historyCache.set(key, {
          expiresAt: Date.now() + PTAX_HISTORY_CACHE_TTL_MS,
          data: parsed,
        });
      }
      return parsed;
    },
  );

  if (!options.signal) {
    inflightHistory.set(key, req);
    req.finally(() => {
      if (inflightHistory.get(key) === req) inflightHistory.delete(key);
    });
  }
  return req;
}

export function getCachedPtaxMonthlyAverage(
  currency: PtaxUiCurrency,
  months = 12,
  nowMs: number = Date.now(),
): PtaxMonthlyAverageResponse | null {
  if (!isBrowser()) return null;
  const key = `${currency}:${months}`;
  const entry = monthlyCache.get(key);
  if (entry && entry.expiresAt > nowMs) {
    return entry.data;
  }
  if (entry) {
    monthlyCache.delete(key);
  }
  return null;
}

export async function fetchPtaxMonthlyAverage(
  currency: PtaxUiCurrency,
  months = 12,
  options: { signal?: AbortSignal; force?: boolean } = {},
): Promise<PtaxMonthlyAverageResponse> {
  const key = `${currency}:${months}`;
  if (!options.force) {
    const cached = getCachedPtaxMonthlyAverage(currency, months);
    if (cached) return cached;
  }

  if (!options.signal && !options.force) {
    const pending = inflightMonthly.get(key);
    if (pending) return pending;
  }

  const path = `/v1/ptax/monthly-average?currency=${encodeURIComponent(currency)}&months=${encodeURIComponent(String(months))}`;
  const req = apiFetch<unknown>(path, { signal: options.signal }).then(
    (raw) => {
      const parsed = parsePtaxMonthlyAverageResponse(raw);
      if (isBrowser()) {
        monthlyCache.set(key, {
          expiresAt: Date.now() + PTAX_MONTHLY_CACHE_TTL_MS,
          data: parsed,
        });
      }
      return parsed;
    },
  );

  if (!options.signal) {
    inflightMonthly.set(key, req);
    req.finally(() => {
      if (inflightMonthly.get(key) === req) inflightMonthly.delete(key);
    });
  }
  return req;
}

export async function fetchPtaxConvert(
  from: PtaxConvertCurrency,
  to: PtaxConvertCurrency,
  amount: string,
  signal?: AbortSignal,
): Promise<PtaxConvertResponse> {
  const params = new URLSearchParams({ from, to, amount });
  const raw = await apiFetch<unknown>(`/v1/ptax/convert?${params.toString()}`, {
    signal,
  });
  return parsePtaxConvertResponse(raw);
}
