import { describe, expect, it } from "vitest";
import {
  computeNiceYAxisTicks,
  computeYAxisDomain,
  formatBrasiliaDateTime,
  formatBrasiliaTime,
  formatHistoryPointLabel,
  formatIsoDateShort,
  formatPtaxDecimal,
  formatPtaxPercent,
  formatPtaxSignedDelta,
  formatYearMonthPtBr,
  normalizeCalculatorAmount,
  planXAxisTicks,
} from "./format";
import historyUsd1D from "./__fixtures__/history-USD-1D.json";

describe("ptax/format — pure string decimal rounding & pt-BR formatting", () => {
  it("rounds with exact ROUND_HALF_UP and carry propagation (no float drift)", () => {
    expect(formatPtaxDecimal("5.888900", 4)).toBe("5,8889");
    expect(formatPtaxDecimal("5.888950", 4)).toBe("5,8890");
    expect(formatPtaxDecimal("9.999950", 4)).toBe("10,0000");
    expect(formatPtaxDecimal("999.999950", 4)).toBe("1.000,0000");
    expect(formatPtaxDecimal("5506499999999999.999994", 4)).toBe(
      "5.506.500.000.000.000,0000",
    );
  });

  it("handles negative numbers, negative zero, and exact zero cleanly", () => {
    expect(formatPtaxDecimal("0.000000", 4)).toBe("0,0000");
    expect(formatPtaxDecimal("-0.000010", 4)).toBe("0,0000");
    expect(formatPtaxDecimal("-0.078750", 4)).toBe("-0,0788");
    expect(formatPtaxDecimal("-9.999950", 4)).toBe("-10,0000");
    expect(formatPtaxDecimal(null, 4)).toBe("—");
  });

  it("formats signed deltas (4 decimals) and percentages (2 decimals with carry)", () => {
    expect(formatPtaxSignedDelta("0.078700", 4)).toBe("+0,0787");
    expect(formatPtaxSignedDelta("-0.061600", 4)).toBe("-0,0616");
    expect(formatPtaxSignedDelta("0.000000", 4)).toBe("0,0000");
    expect(formatPtaxSignedDelta("-0.000010", 4)).toBe("0,0000");

    expect(formatPtaxPercent("1.354514")).toBe("+1,35%");
    expect(formatPtaxPercent("1.355000")).toBe("+1,36%");
    expect(formatPtaxPercent("-1.075000")).toBe("-1,08%");
    expect(formatPtaxPercent("9.995000")).toBe("+10,00%");
    expect(formatPtaxPercent("0.000000")).toBe("0,00%");
    expect(formatPtaxPercent("-0.001000")).toBe("0,00%");
    expect(formatPtaxPercent(null)).toBe("—");
  });
});

describe("ptax/format — calculator input normalization", () => {
  it("accepts pt-BR comma or dot up to 15 integer digits and 6 decimals", () => {
    expect(normalizeCalculatorAmount("")).toEqual({ status: "empty" });
    expect(normalizeCalculatorAmount("   ")).toEqual({ status: "empty" });
    expect(normalizeCalculatorAmount("1000,50")).toEqual({
      status: "valid",
      normalized: "1000.50",
    });
    expect(normalizeCalculatorAmount("0,5")).toEqual({
      status: "valid",
      normalized: "0.5",
    });
    expect(normalizeCalculatorAmount("999999999999999,999999")).toEqual({
      status: "valid",
      normalized: "999999999999999.999999",
    });
  });

  it("rejects zero, negative, scientific notation, multiple separators, and oversized inputs", () => {
    for (const bad of [
      "0",
      "0,000000",
      "-1",
      "+5",
      "1e3",
      "1.000,50",
      "1,2,3",
      "1000000000000000", // 16 integer digits
      "1,1234567", // 7 fractional digits
      "abc",
      "10 00",
    ]) {
      expect(normalizeCalculatorAmount(bad)).toEqual({ status: "invalid" });
    }
  });
});

describe("ptax/format — explicit America/Sao_Paulo timezone (immune to TZ=UTC and TZ=America/Rio_Branco)", () => {
  it("formats 2026-11-19T16:04:18.325Z as 19/11 13:04 Brasília regardless of host TZ", () => {
    expect(formatBrasiliaDateTime("2026-11-19T16:04:18.325Z")).toBe(
      "19/11 13:04",
    );
    expect(formatBrasiliaTime("2026-11-19T16:04:18.325Z")).toBe("13:04");
  });

  it("handles UTC day rollover cleanly (2026-11-22T01:30:00Z === 21/11 22:30 BRT)", () => {
    expect(formatBrasiliaDateTime("2026-11-22T01:30:00.000Z")).toBe(
      "21/11 22:30",
    );
    expect(formatBrasiliaTime("2026-11-22T01:30:00.000Z")).toBe("22:30");
  });

  it("formats ISO dates and YYYY-MM labels purely by string without timezone drift", () => {
    expect(formatIsoDateShort("2026-11-19", false)).toBe("19/11");
    expect(formatIsoDateShort("2025-11-21", true)).toBe("21/11/25");
    expect(
      formatHistoryPointLabel(
        { date: "2026-11-19", timestamp: "2026-11-19T16:04:18.325Z" },
        "1D",
      ),
    ).toBe("13:04");
    expect(
      formatHistoryPointLabel(
        { date: "2026-11-19", timestamp: "2026-11-19T16:04:18.325Z" },
        "1M",
      ),
    ).toBe("19/11");
    expect(formatYearMonthPtBr("2026-11")).toBe("nov/26");
    expect(formatYearMonthPtBr("2025-12")).toBe("dez/25");
  });
});

describe("ptax/format — Y-axis visual domain padding", () => {
  it("adds 1.5% visual padding around min/max of numeric points", () => {
    const [lo, hi] = computeYAxisDomain([5.0, 6.0]);
    expect(lo).toBeCloseTo(4.985, 6);
    expect(hi).toBeCloseTo(6.015, 6);
  });

  it("handles a single point or flat series without zero-span axis collapse", () => {
    const [lo, hi] = computeYAxisDomain([5.8889]);
    expect(lo).toBeLessThan(5.8889);
    expect(hi).toBeGreaterThan(5.8889);
  });
});

describe("ptax/format — nice equidistant Y-axis ticks (real 1M/1Y/12-month data)", () => {
  function expectEquidistantAndContaining(
    values: readonly number[],
    { domain, ticks }: { domain: [number, number]; ticks: number[] },
  ) {
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    const step = ticks[1]! - ticks[0]!;
    expect(step).toBeGreaterThan(0);
    for (let i = 1; i < ticks.length; i += 1) {
      expect(ticks[i]! - ticks[i - 1]!).toBeCloseTo(step, 9);
    }
    expect(domain[0]).toBe(ticks[0]);
    expect(domain[1]).toBe(ticks[ticks.length - 1]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    expect(domain[0]).toBeLessThan(min);
    expect(domain[1]).toBeGreaterThan(max);
  }

  it("1M USD real series (min 5.0377 / max 5.8889) stays equidistant and contains every point", () => {
    const values = [5.0377, 5.530905, 5.8889, 5.037700, 5.888900]; // real stats from history-USD-1M.json
    expectEquidistantAndContaining(values, computeNiceYAxisTicks(values));
  });

  it("1Y USD real series (min 4.8973 / max 5.8889) stays equidistant and contains every point", () => {
    const values = [4.8973, 5.202776, 5.8889, 5.3948]; // real stats from history-USD-1Y.json
    expectEquidistantAndContaining(values, computeNiceYAxisTicks(values));
  });

  it("12-month average USD real series (4.9837 .. 5.621277) stays equidistant and contains every bar", () => {
    const values = [
      5.453091, 5.338024, 5.200617, 5.231586, 5.033075, 4.9837, 5.127571,
      5.113948, 5.153162, 5.144724, 5.1294, 5.621277,
    ]; // real averages from monthly-average-USD.json
    expectEquidistantAndContaining(values, computeNiceYAxisTicks(values));
  });

  it("never collapses a flat/single-value series", () => {
    const { domain, ticks } = computeNiceYAxisTicks([5.8889]);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(domain[0]).toBeLessThan(5.8889);
    expect(domain[1]).toBeGreaterThan(5.8889);
  });
});

describe("ptax/format — X-axis tick plan (real 1D duplicate-minute data)", () => {
  it("suppresses the repeated hh:mm label from two bulletins issued in the same minute", () => {
    const labels = historyUsd1D.points.map((p) => formatBrasiliaTime(p.timestamp));
    // Real fixture: the Fechamento bulletin lands in the same BRT minute as the
    // previous Intermediário one, so the last two labels are identical.
    expect(labels).toEqual(["10:11", "11:11", "12:11", "13:04", "13:04"]);

    const plan = planXAxisTicks(labels);
    expect(plan.map((p) => p.show)).toEqual([true, true, true, true, false]);
  });

  it("anchors only the last label to end (so it never overflows the right edge); every other label, including the first, stays centered", () => {
    const plan = planXAxisTicks(["a", "b", "c", "d"]);
    expect(plan.map((p) => p.textAnchor)).toEqual([
      "middle",
      "middle",
      "middle",
      "end",
    ]);
  });

  it("a single label (both first and last) is anchored end", () => {
    const plan = planXAxisTicks(["only"]);
    expect(plan).toEqual([{ value: "only", show: true, textAnchor: "end" }]);
  });
});
