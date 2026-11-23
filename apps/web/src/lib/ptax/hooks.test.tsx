// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/client-api";
import * as ptaxApi from "./api";
import { PTAX_COPY } from "./copy";
import {
  usePtaxHistory,
  usePtaxLatest,
  usePtaxMonthlyAverage,
} from "./hooks";
import type { PtaxLatestResponse } from "./types";

import latestFixture from "./__fixtures__/latest.json";
import usd1MFixture from "./__fixtures__/history-USD-1M.json";
import eur1MFixture from "./__fixtures__/history-EUR-1M.json";
import monthlyUsdFixture from "./__fixtures__/monthly-average-USD.json";
import monthlyEurFixture from "./__fixtures__/monthly-average-EUR.json";

beforeEach(() => {
  ptaxApi.clearPtaxClientCache();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ptax/hooks & api — review fixes D, E, F, G", () => {
  it("D: after 1 retry on USD, switching USD -> EUR -> USD within 30s respects cache", async () => {
    let networkCalls = 0;
    let failFirst = true;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      networkCalls += 1;
      if (failFirst) {
        failFirst = false;
        return new Response(JSON.stringify({ message: "unavailable" }), {
          status: 503,
          headers: { "content-type": "application/json" },
        });
      }
      const body = url.includes("currency=EUR") ? eur1MFixture : usd1MFixture;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const { result, rerender } = renderHook(
      ({ currency }: { currency: "USD" | "EUR" }) =>
        usePtaxHistory(currency, "1M", true),
      { initialProps: { currency: "USD" as "USD" | "EUR" } },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(networkCalls).toBe(1);

    // Retry USD -> call #2 populates USD:1M cache
    act(() => {
      result.current.reload();
    });
    await waitFor(() =>
      expect(result.current.data?.currency).toBe("USD"),
    );
    expect(networkCalls).toBe(2);

    // Switch to EUR -> call #3 populates EUR:1M cache
    rerender({ currency: "EUR" });
    await waitFor(() =>
      expect(result.current.data?.currency).toBe("EUR"),
    );
    expect(networkCalls).toBe(3);

    // Switch back to USD within 30s -> MUST hit cache (still 3 network calls!)
    rerender({ currency: "USD" });
    await waitFor(() =>
      expect(result.current.data?.currency).toBe("USD"),
    );
    expect(networkCalls).toBe(3);
  });

  it("D (monthly): after 1 retry on USD, switching USD -> EUR -> USD respects 10-min cache", async () => {
    let networkCalls = 0;
    let failFirst = true;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      networkCalls += 1;
      if (failFirst) {
        failFirst = false;
        return new Response(JSON.stringify({ message: "unavailable" }), {
          status: 503,
          headers: { "content-type": "application/json" },
        });
      }
      const body = url.includes("currency=EUR")
        ? monthlyEurFixture
        : monthlyUsdFixture;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const { result, rerender } = renderHook(
      ({ currency }: { currency: "USD" | "EUR" }) =>
        usePtaxMonthlyAverage(currency),
      { initialProps: { currency: "USD" as "USD" | "EUR" } },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => {
      result.current.reload();
    });
    await waitFor(() => expect(result.current.data?.currency).toBe("USD"));
    expect(networkCalls).toBe(2);

    rerender({ currency: "EUR" });
    await waitFor(() => expect(result.current.data?.currency).toBe("EUR"));
    expect(networkCalls).toBe(3);

    rerender({ currency: "USD" });
    await waitFor(() => expect(result.current.data?.currency).toBe("USD"));
    expect(networkCalls).toBe(3);
  });

  it("E: visibilitychange + focus on tab return coalesces into a single /v1/ptax/latest call", async () => {
    let calls = 0;
    vi.spyOn(ptaxApi, "fetchPtaxLatest").mockImplementation(async () => {
      calls += 1;
      return latestFixture as unknown as PtaxLatestResponse;
    });

    const { result } = renderHook(() => usePtaxLatest());
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(calls).toBe(1);

    // Advance Date.now past the 1s coalesce window from initial mount
    const baseNow = Date.now() + 5_000;
    vi.spyOn(Date, "now").mockReturnValue(baseNow);
    Object.defineProperty(document, "hidden", {
      value: false,
      configurable: true,
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => expect(calls).toBe(2));
    // Must stay 2 (1 initial + 1 coalesced tab-return), never 3
    expect(calls).toBe(2);
  });

  it("F: pure cache read returns undefined when expired without mutating the underlying Map", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(usd1MFixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const t0 = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);
    await ptaxApi.fetchPtaxHistory("USD", "1M");

    // Reading past TTL returns undefined WITHOUT deleting the entry from the Map
    expect(ptaxApi.getCachedPtaxHistory("USD", "1M", t0 + 60_000)).toBeUndefined();
    // Proof the Map was NOT mutated by the read: reading at t0 + 1_000 still finds the entry!
    expect(ptaxApi.getCachedPtaxHistory("USD", "1M", t0 + 1_000)?.currency).toBe(
      "USD",
    );

    // Same for monthly-average cache
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(monthlyUsdFixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await ptaxApi.fetchPtaxMonthlyAverage("USD", 12);
    expect(
      ptaxApi.getCachedPtaxMonthlyAverage("USD", 12, t0 + 20 * 60_000),
    ).toBeUndefined();
    expect(
      ptaxApi.getCachedPtaxMonthlyAverage("USD", 12, t0 + 1_000)?.currency,
    ).toBe("USD");
  });

  it("G: background refresh error preserves existing quote and sets refreshError; initial failure sets full error", async () => {
    // 1) Initial load fails -> full error, data is null
    const fetchSpy = vi
      .spyOn(ptaxApi, "fetchPtaxLatest")
      .mockRejectedValueOnce(new ApiError(503, "Unavailable"));

    const first = renderHook(() => usePtaxLatest());
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.data).toBeNull();
    expect(first.result.current.error).toBe(PTAX_COPY.errors.serverUnavailable);
    expect(first.result.current.refreshError).toBeNull();
    first.unmount();

    // 2) Initial load succeeds, then tab-return refresh fails -> preserves data + sets refreshError
    fetchSpy.mockResolvedValueOnce(
      latestFixture as unknown as PtaxLatestResponse,
    );
    fetchSpy.mockRejectedValueOnce(new ApiError(503, "Unavailable"));

    const second = renderHook(() => usePtaxLatest());
    await waitFor(() => expect(second.result.current.data).not.toBeNull());
    expect(second.result.current.error).toBeNull();
    expect(second.result.current.refreshError).toBeNull();

    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 5_000);
    Object.defineProperty(document, "hidden", {
      value: false,
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() =>
      expect(second.result.current.refreshError).toBe(
        "Não foi possível atualizar agora.",
      ),
    );
    // Data MUST remain intact and full-screen error MUST stay null
    expect(second.result.current.data?.rates.USD?.value).toBe("5.888900");
    expect(second.result.current.error).toBeNull();
  });

  it("H: api.ts has no dead inflight dedupe maps (hooks always pass AbortSignal)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(path.join(__dirname, "api.ts"), "utf8");
    expect(src).not.toMatch(/inflight(Latest|History|Monthly)/);
  });
});
