import { describe, it, expect } from "vitest";
import { parsePeriodParam, formatVariation, rateOrDash, avgRateDeltaText } from "./chart";

describe("parsePeriodParam", () => {
  it("accepts valid periods", () => {
    for (const p of ["30d", "90d", "12m", "ytd"]) {
      expect(parsePeriodParam(p)).toBe(p);
    }
  });
  it("falls back to 30d for invalid/missing", () => {
    expect(parsePeriodParam(null)).toBe("30d");
    expect(parsePeriodParam(undefined)).toBe("30d");
    expect(parsePeriodParam("")).toBe("30d");
    expect(parsePeriodParam("6m")).toBe("30d");
    expect(parsePeriodParam("nope")).toBe("30d");
  });
});

describe("formatVariation (no previous period → null → '—' in the UI)", () => {
  it("returns null when there is no variation", () => {
    expect(formatVariation(null)).toBeNull();
  });
  it("marks 100 as 'new' and formats percentages otherwise", () => {
    expect(formatVariation(100)).toEqual({ kind: "new" });
    expect(formatVariation(12)).toEqual({ kind: "pct", text: "+12%", dir: 1 });
    expect(formatVariation(-5)).toEqual({ kind: "pct", text: "-5%", dir: -1 });
    expect(formatVariation(0)).toEqual({ kind: "pct", text: "0%", dir: 0 });
  });
});

describe("rateOrDash (avg rate)", () => {
  it("shows the rate when > 0", () => {
    expect(rateOrDash(5.4215)).toBe("R$ 5,4215");
    expect(rateOrDash(5)).toBe("R$ 5,00");
  });
  it("shows '—' for 0 or null (never R$ 0,00)", () => {
    expect(rateOrDash(0)).toBe("—");
    expect(rateOrDash(null)).toBe("—");
  });
});

describe("avgRateDeltaText (no 'Novo'; only with prior period + rate)", () => {
  it("returns a percent only with rate > 0 and a real variation", () => {
    expect(avgRateDeltaText(5.42, 1.2)).toEqual({ text: "+1.2%", dir: 1 });
    expect(avgRateDeltaText(5.42, -2)).toEqual({ text: "−2%", dir: -1 });
  });
  it("hides when rate is 0/null", () => {
    expect(avgRateDeltaText(0, 5)).toBeNull();
    expect(avgRateDeltaText(null, 5)).toBeNull();
  });
  it("hides when there is no prior period (null) or the 100 'new' sentinel", () => {
    expect(avgRateDeltaText(5.42, null)).toBeNull();
    expect(avgRateDeltaText(5.42, 100)).toBeNull();
  });
});
