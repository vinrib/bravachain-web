"use client";

import { useEffect, useRef, useState } from "react";
import { getLiveRates } from "./api";
import type { LiveRates } from "./types";

/**
 * Polls GET /v1/rates/live every `intervalMs` (default 60s) and pauses while the
 * tab is hidden (Page Visibility). No external dependency (React Query not used
 * in this project). Resumes and refetches when the tab becomes visible again.
 */
export function useLiveRates(intervalMs = 60_000) {
  const [data, setData] = useState<LiveRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;

    async function load(initial: boolean) {
      if (initial) setLoading(true);
      try {
        const r = await getLiveRates();
        if (active) {
          setData(r);
          setError(false);
        }
      } catch {
        if (active && initial) setError(true);
      } finally {
        if (active && initial) setLoading(false);
      }
    }

    function start() {
      stop();
      timer.current = setInterval(() => void load(false), intervalMs);
    }
    function stop() {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        void load(false);
        start();
      } else {
        stop();
      }
    }

    void load(true);
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, reloadKey]);

  return { data, loading, error, reload: () => setReloadKey((k) => k + 1) };
}
