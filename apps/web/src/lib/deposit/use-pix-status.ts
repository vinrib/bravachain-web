"use client";

import { useEffect, useState } from "react";
import { getPixStatus } from "./api";
import { depositUiStatus, isFinalStatus } from "./status";
import type { DepositUiStatus } from "./types";

/**
 * Polls GET /v1/pix/status/:txid every 5s, pausing while the tab is hidden, and
 * stops once the status is final or `stopped` is set (e.g. on expiry). No
 * external dependency. Starts from `initialStatus` so the first poll isn't
 * needed to show the initial state.
 */
export function usePixStatus(
  txid: string | null,
  initialStatus: string,
  stopped: boolean,
) {
  const [ui, setUi] = useState<DepositUiStatus>(() => depositUiStatus(initialStatus));

  useEffect(() => {
    if (!txid || stopped || isFinalStatus(ui)) return;
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      try {
        const r = await getPixStatus(txid as string);
        if (active) setUi(depositUiStatus(r.status));
      } catch {
        /* keep current UI state; next tick retries */
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
  }, [txid, stopped, ui]);

  return ui;
}
