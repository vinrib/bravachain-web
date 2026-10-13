import { describe, it, expect } from "vitest";
import {
  normalizeSummary,
  normalizeTpv,
  normalizeRails,
  normalizeRates,
} from "./normalize";

describe("normalizeSummary", () => {
  it("coerces Decimal strings and keeps missing values null", () => {
    const s = normalizeSummary({
      tpv: "1000000.50",
      tpvVariation: 0.12,
      avgRateUsd: "5.04",
      feesPaid: "1250.00",
      withdrawals: "800000",
    });
    expect(s.tpv).toBe(1000000.5);
    expect(s.tpvVariation).toBe(0.12);
    expect(s.avgRateUsd).toBe(5.04);
    expect(s.feesPaid).toBe(1250);
    expect(s.avgRateEur).toBeNull();
    expect(s.withdrawalsVariation).toBeNull();
  });

  it("unwraps a { data } envelope and accepts aliases", () => {
    const s = normalizeSummary({ data: { tpvBrl: 10, feesPaidBrl: 2, totalWithdrawnBrl: 3 } });
    expect(s.tpv).toBe(10);
    expect(s.feesPaid).toBe(2);
    expect(s.withdrawals).toBe(3);
  });
});

describe("normalizeTpv", () => {
  it("maps months from a wrapper key and flags partial", () => {
    const out = normalizeTpv({
      months: [
        { month: "2026-08", label: "Ago", value: "1000000" },
        { month: "2026-09", label: "Set", value: "500000", partial: true },
      ],
    });
    expect(out).toHaveLength(2);
    expect(out[1]!.partial).toBe(true);
    expect(out[0]!.value).toBe(1000000);
  });
  it("accepts a bare array", () => {
    expect(normalizeTpv([{ month: "x", value: 5 }])[0]!.value).toBe(5);
  });
});

describe("normalizeRails", () => {
  it("maps name/value/percent with aliases", () => {
    const out = normalizeRails({
      rails: [{ method: "USD_WIRE", amountBrl: "900000", pct: "60" }],
    });
    expect(out[0]!.name).toBe("USD_WIRE");
    expect(out[0]!.value).toBe(900000);
    expect(out[0]!.percent).toBe(60);
  });
});

describe("normalizeRates", () => {
  it("maps usd/eur per month, nulls tolerated", () => {
    const out = normalizeRates({
      months: [{ month: "2026-09", label: "Set", usd: "5.04", eur: null }],
    });
    expect(out[0]!.usd).toBe(5.04);
    expect(out[0]!.eur).toBeNull();
  });
});

describe("empty/garbage input", () => {
  it("is safe", () => {
    expect(normalizeTpv(null)).toEqual([]);
    expect(normalizeRails(undefined)).toEqual([]);
    expect(normalizeSummary(null).tpv).toBeNull();
  });
});
