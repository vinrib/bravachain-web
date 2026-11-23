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

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Clears all client-side PTAX caches (intended for unit tests and manual retries). */
export function clearPtaxClientCache(): void {
  historyCache.clear();
  monthlyCache.clear();
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
  const raw = await apiFetch<unknown>(path, { signal });
  return parsePtaxLatestResponse(raw);
}

/**
 * Pure side-effect-free cache read: returns `undefined` when missing or expired,
 * never mutating the underlying Map (pruning happens in the writer/effect).
 */
export function getCachedPtaxHistory(
  currency: PtaxUiCurrency,
  period: PtaxPeriod,
  nowMs: number = Date.now(),
): PtaxHistoryResponse | undefined {
  if (!isBrowser()) return undefined;
  const key = `${currency}:${period}`;
  const entry = historyCache.get(key);
  if (entry && entry.expiresAt > nowMs) {
    return entry.data;
  }
  return undefined;
}

export async function fetchPtaxHistory(
  currency: PtaxUiCurrency,
  period: PtaxPeriod,
  options: { signal?: AbortSignal; force?: boolean } = {},
): Promise<PtaxHistoryResponse> {
  const key = `${currency}:${period}`;
  const now = Date.now();
  if (!options.force) {
    const cached = getCachedPtaxHistory(currency, period, now);
    if (cached !== undefined) return cached;
  }
  // Evict expired entry inside the async effect/writer, never during render
  const existing = historyCache.get(key);
  if (existing && (options.force || existing.expiresAt <= now)) {
    historyCache.delete(key);
  }

  const path = `/v1/ptax/history?currency=${encodeURIComponent(currency)}&period=${encodeURIComponent(period)}`;
  const raw = await apiFetch<unknown>(path, { signal: options.signal });
  const parsed = parsePtaxHistoryResponse(raw);
  if (isBrowser()) {
    historyCache.set(key, {
      expiresAt: Date.now() + PTAX_HISTORY_CACHE_TTL_MS,
      data: parsed,
    });
  }
  return parsed;
}

/**
 * Pure side-effect-free cache read: returns `undefined` when missing or expired,
 * never mutating the underlying Map (pruning happens in the writer/effect).
 */
export function getCachedPtaxMonthlyAverage(
  currency: PtaxUiCurrency,
  months = 12,
  nowMs: number = Date.now(),
): PtaxMonthlyAverageResponse | undefined {
  if (!isBrowser()) return undefined;
  const key = `${currency}:${months}`;
  const entry = monthlyCache.get(key);
  if (entry && entry.expiresAt > nowMs) {
    return entry.data;
  }
  return undefined;
}

export async function fetchPtaxMonthlyAverage(
  currency: PtaxUiCurrency,
  months = 12,
  options: { signal?: AbortSignal; force?: boolean } = {},
): Promise<PtaxMonthlyAverageResponse> {
  const key = `${currency}:${months}`;
  const now = Date.now();
  if (!options.force) {
    const cached = getCachedPtaxMonthlyAverage(currency, months, now);
    if (cached !== undefined) return cached;
  }
  // Evict expired entry inside the async effect/writer, never during render
  const existing = monthlyCache.get(key);
  if (existing && (options.force || existing.expiresAt <= now)) {
    monthlyCache.delete(key);
  }

  const path = `/v1/ptax/monthly-average?currency=${encodeURIComponent(currency)}&months=${encodeURIComponent(String(months))}`;
  const raw = await apiFetch<unknown>(path, { signal: options.signal });
  const parsed = parsePtaxMonthlyAverageResponse(raw);
  if (isBrowser()) {
    monthlyCache.set(key, {
      expiresAt: Date.now() + PTAX_MONTHLY_CACHE_TTL_MS,
      data: parsed,
    });
  }
  return parsed;
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
