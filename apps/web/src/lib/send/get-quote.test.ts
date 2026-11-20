import { describe, it, expect } from "vitest";
import { getQuote } from "./api";
import { ApiError } from "@/lib/client-api";

describe("getQuote (mock) — matches the Web 12 example values", () => {
  it("USD send R$10.000 → beneficiary receives US$ 1.749,93 at 5,54", async () => {
    const q = await getQuote({ currency: "USD", side: "send", amount: 10000 });
    expect(q.lines.sendAmount).toBe(10000);
    expect(q.lines.aveniaFee).toBe(48);
    expect(q.lines.railFee).toBe(55.4);
    expect(q.lines.bravachainCommission).toBe(202);
    expect(q.lines.receiveAmount).toBe(1749.93);
    expect(q.referenceRate).toBe(5.54);
    expect(q.expiresAt).not.toBeNull();
    expect(q.enoughBalance).toBe(true);
    expect(q.isEstimate).toBe(true);
  });

  it("EUR send R$10.000 → € 1.517,69 at 6,42", async () => {
    const q = await getQuote({ currency: "EUR", side: "send", amount: 10000 });
    expect(q.lines.receiveAmount).toBe(1517.69);
    expect(q.lines.railFee).toBe(6.42);
  });

  it("BRL send does not expire and nets the fees", async () => {
    const q = await getQuote({ currency: "BRL", side: "send", amount: 10000 });
    expect(q.expiresAt).toBeNull();
    expect(q.lines.receiveAmount).toBe(10000 - (2 + 1 + 5));
  });

  it("fixing the receive side solves for the BRL you send", async () => {
    const q = await getQuote({ currency: "USD", side: "receive", amount: 1000 });
    expect(q.lines.sendAmount).toBe(5845.4); // 1000*5.54 + 48 + 55.40 + 202
  });

  it("marks enoughBalance=false above the balance (API decides, not the front)", async () => {
    const q = await getQuote({ currency: "USD", side: "send", amount: 300000 });
    expect(q.enoughBalance).toBe(false);
  });

  it("rejects with an Avenia-limit ApiError above the cap", async () => {
    await expect(getQuote({ currency: "USD", side: "send", amount: 2_000_000 })).rejects.toMatchObject({
      code: "AVENIA_LIMIT",
    });
    await expect(
      getQuote({ currency: "USD", side: "send", amount: 2_000_000 }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
