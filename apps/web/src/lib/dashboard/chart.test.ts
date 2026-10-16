import { describe, it, expect } from "vitest";
import { parsePeriodParam, formatVariation } from "./chart";

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
