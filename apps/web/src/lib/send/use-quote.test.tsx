// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import type { SendQuote } from "./types";

interface Deferred {
  resolve: (q: SendQuote) => void;
  reject: (e: unknown) => void;
  promise: Promise<SendQuote>;
}
const calls: Deferred[] = [];

vi.mock("./api", () => ({
  getQuote: () => {
    let resolve!: (q: SendQuote) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<SendQuote>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    calls.push({ resolve, reject, promise });
    return promise;
  },
}));

import { useQuote } from "./use-quote";

const quote = (id: string): SendQuote => ({
  quoteId: id,
  lines: { sendAmount: 1, aveniaFee: 0, railFee: 0, bravachainCommission: 0, receiveAmount: 1 },
  referenceRate: 1,
  expiresAt: null,
  isEstimate: true,
  balanceBrl: 1,
  enoughBalance: true,
  invoiceRequired: false,
  messageApplied: true,
});
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

afterEach(() => {
  cleanup();
  calls.length = 0;
});

describe("useQuote race safety", () => {
  it("keeps the newest quote even when an older request resolves later", async () => {
    const { result, rerender } = renderHook(({ amount }) => useQuote("USD", "send", amount), {
      initialProps: { amount: 100 },
    });

    // Debounce (400ms) → first request in flight.
    await act(async () => {
      await wait(450);
    });
    rerender({ amount: 200 });
    // Debounce again → second request in flight.
    await act(async () => {
      await wait(450);
    });
    expect(calls.length).toBe(2);

    // Resolve the NEWER request first, then the stale one.
    await act(async () => {
      calls[1]!.resolve(quote("new"));
      await wait(0);
    });
    expect(result.current.quote?.quoteId).toBe("new");

    await act(async () => {
      calls[0]!.resolve(quote("old"));
      await wait(0);
    });
    // The stale response must NOT overwrite the newer one.
    expect(result.current.quote?.quoteId).toBe("new");
    expect(result.current.status).toBe("ready");
  });
});
