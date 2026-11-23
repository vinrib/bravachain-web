export const PTAX_TIME_ZONE = "America/Sao_Paulo";

/** Single source of truth for currencies displayed on the PTAX quotes screen. */
export const PTAX_UI_CURRENCIES = ["USD", "EUR"] as const;
export type PtaxUiCurrency = (typeof PTAX_UI_CURRENCIES)[number];

export const PTAX_PERIODS = ["1D", "1W", "1M", "3M", "1Y"] as const;
export type PtaxPeriod = (typeof PTAX_PERIODS)[number];

export const PTAX_CONVERT_CURRENCIES = ["BRL", ...PTAX_UI_CURRENCIES] as const;
export type PtaxConvertCurrency = (typeof PTAX_CONVERT_CURRENCIES)[number];

export const PTAX_CURRENCY_META: Record<
  PtaxConvertCurrency,
  { code: PtaxConvertCurrency; name: string; pairLabel: string }
> = {
  BRL: { code: "BRL", name: "Real brasileiro", pairLabel: "BRL" },
  USD: { code: "USD", name: "Dólar americano", pairLabel: "USD/BRL" },
  EUR: { code: "EUR", name: "Euro", pairLabel: "EUR/BRL" },
};

/** Polling interval for /v1/ptax/latest (pauses when tab is hidden). */
export const PTAX_LATEST_POLL_MS = 60_000;

/** Client-side in-memory cache TTL for /v1/ptax/history (matches API 30s cache). */
export const PTAX_HISTORY_CACHE_TTL_MS = 30_000;

/** Client-side in-memory cache TTL for /v1/ptax/monthly-average (10 minutes). */
export const PTAX_MONTHLY_CACHE_TTL_MS = 10 * 60_000;

/** Debounce for /v1/ptax/convert requests triggered by user typing. */
export const PTAX_CONVERT_DEBOUNCE_MS = 400;
