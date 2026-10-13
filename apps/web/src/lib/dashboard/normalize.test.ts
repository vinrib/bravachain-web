import { describe, it, expect } from "vitest";
import { normalizeDashboard } from "./normalize";
import { formatVariation } from "./chart";

function currentYM(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

describe("normalizeDashboard summary", () => {
  it("maps nested keys and coerces Decimal strings", () => {
    const { summary } = normalizeDashboard({
      summary: {
        period: { start: "2026-09-01", end: "2026-09-30" },
        tpv: { usd: "100", eur: "0", brlEquiv: "1000000.50", vsLastPeriod: 12 },
        brlConverted: { total: "900000", vsLastPeriod: 8 },
        avgRate: { usdBrl: "5.04", eurBrl: "5.42", vsLastPeriod: -2 },
        bravaChainRevenue: { total: "1250.00", avgPercent: "1.2", vsLastPeriod: 100 },
        withdrawals: { total: "800000", count: 4, avgAmount: "200000", currentBalance: "50000" },
      },
    });
    expect(summary.tpvBrl).toBe(1000000.5);
    expect(summary.tpvVariation).toBe(12);
    expect(summary.avgRateUsd).toBe(5.04);
    expect(summary.avgRateEur).toBe(5.42);
    expect(summary.avgRateVariation).toBe(-2);
    expect(summary.feesPaid).toBe(1250);
    expect(summary.feesPaidVariation).toBe(100);
    expect(summary.withdrawalsTotal).toBe(800000);
    expect(summary.withdrawalsCount).toBe(4);
    expect(summary.periodStart).toBe("2026-09-01");
  });
});

describe("normalizeDashboard series", () => {
  it("flags the current month as partial and reads brlEquiv", () => {
    const { tpv } = normalizeDashboard({
      tpv: {
        series: [
          { month: "2000-01", label: "Jan", brlEquiv: "500000" },
          { month: currentYM(), label: "Atual", brlEquiv: "200000" },
        ],
      },
    });
    expect(tpv[0]!.value).toBe(500000);
    expect(tpv[0]!.partial).toBe(false);
    expect(tpv[1]!.partial).toBe(true);
  });

  it("turns a 0 rate into null (no data that month)", () => {
    const { rates } = normalizeDashboard({
      rates: { series: [{ month: "2026-09", label: "Set", usdBrl: "5.04", eurBrl: 0 }] },
    });
    expect(rates[0]!.usd).toBe(5.04);
    expect(rates[0]!.eur).toBeNull();
  });

  it("maps rails (label/amountBrl/percentage)", () => {
    const { rails } = normalizeDashboard({
      rails: { rails: [{ rail: "USD_WIRE", label: "USD · Wire", amountBrl: "900000", percentage: 60 }] },
    });
    expect(rails[0]!.name).toBe("USD · Wire");
    expect(rails[0]!.value).toBe(900000);
    expect(rails[0]!.percent).toBe(60);
  });
});

describe("formatVariation", () => {
  it("treats the value as percent (not fraction)", () => {
    expect(formatVariation(12)).toEqual({ kind: "pct", text: "+12%", dir: 1 });
    expect(formatVariation(-2.5)).toEqual({ kind: "pct", text: "-2.5%", dir: -1 });
    expect(formatVariation(0)).toEqual({ kind: "pct", text: "0%", dir: 0 });
  });
  it("treats exactly 100 as 'new' (prior period was 0)", () => {
    expect(formatVariation(100)).toEqual({ kind: "new" });
  });
  it("returns null when absent", () => {
    expect(formatVariation(null)).toBeNull();
  });
});

describe("empty input", () => {
  it("is safe", () => {
    const d = normalizeDashboard(null);
    expect(d.tpv).toEqual([]);
    expect(d.rails).toEqual([]);
    expect(d.summary.tpvBrl).toBeNull();
  });
});
