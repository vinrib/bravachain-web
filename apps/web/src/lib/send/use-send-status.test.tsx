// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import type { SendResult } from "./types";

const getSend = vi.hoisted(() => vi.fn());
vi.mock("./api", () => ({
  getSend,
  isFinalSendStatus: (s: string) => s === "concluido" || s === "recusado" || s === "falha",
}));

import { useSendStatus } from "./use-send-status";

const seed: SendResult = { id: "snd_1", status: "processando", reason: null };

afterEach(() => {
  cleanup();
  getSend.mockReset();
  vi.useRealTimers();
});

describe("useSendStatus polling", () => {
  it("polls until terminal, then stops", async () => {
    vi.useFakeTimers();
    getSend
      .mockResolvedValueOnce({ id: "snd_1", status: "processando", reason: null })
      .mockResolvedValue({ id: "snd_1", status: "concluido", reason: null });

    const { result } = renderHook(() => useSendStatus("snd_1", seed));
    expect(result.current.status).toBe("processando");

    // First poll (still processando).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(result.current.status).toBe("processando");

    // Second poll settles it.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });
    expect(result.current.status).toBe("concluido");

    // Polling has stopped — no further calls after reaching a terminal state.
    const callsAtTerminal = getSend.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(getSend.mock.calls.length).toBe(callsAtTerminal);
  });
});
