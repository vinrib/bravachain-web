"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/client-api";
import { getPixStatus } from "./api";
import { depositUiStatus, isFinalStatus } from "./status";
import type { DepositUiStatus, PixStatus } from "./types";

/**
 * Polls GET /v1/pix/status/:txid every 5s, pausing while the tab is hidden, and
 * stops once the status is final (paid/failed), `stopped` is set (client-side
 * expiry), or the deposit is not found (404). No external dependency.
 */
export function usePixStatus(
  txid: string | null,
  initialStatus: string,
  stopped: boolean,
): { ui: DepositUiStatus; notFound: boolean; data: PixStatus | null } {
  const [ui, setUi] = useState<DepositUiStatus>(() => depositUiStatus(initialStatus));
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<PixStatus | null>(null);

  useEffect(() => {
    if (!txid || stopped || notFound || isFinalStatus(ui)) return;
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      try {
        const r = await getPixStatus(txid as string);
        if (active) {
          setData(r);
          setUi(depositUiStatus(r.status));
        }
      } catch (err) {
        if (active && err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        }
        /* other errors: keep current UI state; next tick retries */
      }
    }
    function start() {
      stop();
      timer = setInterval(poll, 5000);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        void poll();
        start();
      } else {
        stop();
      }
    }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [txid, stopped, ui, notFound]);

  return { ui, notFound, data };
}
