"use client";

import { useEffect, useState } from "react";
import { getSend, isFinalSendStatus } from "./api";
import type { SendResult, SendStatus } from "./types";

/**
 * Polls GET /v1/send/:id every 2.5s until the status is terminal (concluido /
 * recusado / falha), pausing while the tab is hidden. Seeded with the result
 * from createSend so the timeline shows "processando" immediately.
 */
export function useSendStatus(
  id: string | null,
  initial: SendResult,
): { status: SendStatus; reason: string | null } {
  const [status, setStatus] = useState<SendStatus>(initial.status);
  const [reason, setReason] = useState<string | null>(initial.reason ?? null);

  useEffect(() => {
    if (!id || isFinalSendStatus(status)) return;
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      try {
        const r = await getSend(id as string);
        if (active) {
          setStatus(r.status);
          setReason(r.reason ?? null);
        }
      } catch {
        /* transient error: keep current state; next tick retries */
      }
    }
    function start() {
      stop();
      timer = setInterval(poll, 2500);
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
  }, [id, status]);

  return { status, reason };
}
