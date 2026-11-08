"use client";

import { useEffect, useRef, useState } from "react";
import { getQuote } from "./api";
import type { SendCurrency, SendQuote } from "./types";

export type QuoteStatus = "idle" | "calculating" | "ready" | "error";

interface QuoteState {
  status: QuoteStatus;
  quote: SendQuote | null;
  /** The thrown error when status is "error" (lets the UI relay Avenia's message). */
  error: unknown;
}

/**
 * Debounced, race-safe quoting for the amount step. Re-quotes when the fixed
 * side or amount changes (400 ms debounce); a monotonic request id drops any
 * response that is no longer the latest, so old and new answers never collide.
 * `refresh()` re-quotes on demand (e.g. after the quote expires).
 */
export function useQuote(
  currency: SendCurrency,
  side: "send" | "receive",
  amount: number,
): QuoteState & { refresh: () => void } {
  const [state, setState] = useState<QuoteState>({ status: "idle", quote: null, error: null });
  const reqId = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const id = ++reqId.current;
    const valid = amount > 0;
    const timer = setTimeout(
      () => {
        if (!valid) {
          if (reqId.current === id) setState({ status: "idle", quote: null, error: null });
          return;
        }
        setState((s) => ({ status: "calculating", quote: s.quote, error: null }));
        getQuote({ currency, side, amount })
          .then((quote) => {
            if (reqId.current === id) setState({ status: "ready", quote, error: null });
          })
          .catch((error) => {
            if (reqId.current === id) setState({ status: "error", quote: null, error });
          });
      },
      valid ? 400 : 0,
    );
    return () => clearTimeout(timer);
  }, [currency, side, amount, refreshKey]);

  return { ...state, refresh: () => setRefreshKey((k) => k + 1) };
}
