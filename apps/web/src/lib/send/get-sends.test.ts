import { describe, it, expect } from "vitest";
import { getSends, getSendReceipt } from "./api";

describe("getSends / getSendReceipt (mock)", () => {
  it("lists the example sends", async () => {
    const sends = await getSends();
    expect(sends.length).toBeGreaterThan(0);
    expect(sends.some((s) => s.beneficiaryName === "Harbor Coffee Imports LLC")).toBe(true);
  });

  it("builds a USD receipt with the fee breakdown and identifier", async () => {
    const r = await getSendReceipt("snd-1");
    expect(r.lines.sendAmount).toBe(10000);
    expect(r.lines.aveniaFee).toBe(48);
    expect(r.lines.receiveAmount).toBe(1749.93);
    expect(r.referenceRate).toBe(5.54);
    expect(r.identifier).toBe("AVN-20261104-SND-1");
    expect(r.purposeCode).toBe("12995");
  });

  it("derives the BRL receive amount (net of fees) and omits the purpose", async () => {
    const r = await getSendReceipt("snd-3");
    expect(r.currency).toBe("BRL");
    expect(r.lines.receiveAmount).toBe(2500 - (2 + 1 + 5));
    expect(r.purposeCode).toBeNull();
    expect(r.message).toBe("");
  });
});
