import { describe, expect, it } from "vitest";
import {
  computeLimitUsagePercent,
  formatCnpj,
  formatCompanyDateBr,
  formatCompanyDayMonthBr,
  formatLimitAmountPtBr,
  maskCpf,
} from "./format";

describe("company formatters", () => {
  it("formats integers and decimals in pt-BR without negative zero", () => {
    expect(formatLimitAmountPtBr(250000)).toBe("250.000");
    expect(formatLimitAmountPtBr(42500.5)).toBe("42.500,50");
    expect(formatLimitAmountPtBr(0)).toBe("0");
    expect(formatLimitAmountPtBr(-0)).toBe("0");
    expect(formatLimitAmountPtBr(Number.NaN)).toBe("0");
  });

  it("computes clamped usage percentages safely", () => {
    expect(computeLimitUsagePercent(42500, 100000)).toBe(43);
    expect(computeLimitUsagePercent(0, 80000)).toBe(0);
    expect(computeLimitUsagePercent(150000, 100000)).toBe(100);
    expect(computeLimitUsagePercent(-10, 100)).toBe(0);
    expect(computeLimitUsagePercent(10, 0)).toBe(0);
    expect(computeLimitUsagePercent(null, 100)).toBe(0);
    expect(computeLimitUsagePercent(50, null)).toBe(0);
  });

  it("formats YYYY-MM-DD and ISO dates without timezone off-by-one", () => {
    expect(formatCompanyDateBr("2026-10-12")).toBe("12/10/2026");
    // 2026-10-15T01:30:00Z is 2026-10-14 22:30 in America/Sao_Paulo (-03:00)
    expect(formatCompanyDateBr("2026-10-15T01:30:00.000Z")).toBe("14/10/2026");
    expect(formatCompanyDateBr("2026-10-15T15:00:00.000Z")).toBe("15/10/2026");
  });

  it("formats dd/mm strictly in America/Sao_Paulo regardless of host TZ", () => {
    expect(formatCompanyDayMonthBr("2026-10-12")).toBe("12/10");
    expect(formatCompanyDayMonthBr("2026-10-15T01:30:00.000Z")).toBe("14/10");
    expect(formatCompanyDayMonthBr("2026-10-15T15:00:00.000Z")).toBe("15/10");
    expect(formatCompanyDayMonthBr("invalid")).toBe("");
  });

  it("masks 11-digit CPFs and preserves already masked CPFs", () => {
    expect(maskCpf("12345678901")).toBe("***.456.789-**");
    expect(maskCpf("123.456.789-01")).toBe("***.456.789-**");
    expect(maskCpf("***.000.000-**")).toBe("***.000.000-**");
  });

  it("formats 14-digit CNPJs", () => {
    expect(formatCnpj("12345678000199")).toBe("12.345.678/0001-99");
    expect(formatCnpj("00.000.000/0001-00")).toBe("00.000.000/0001-00");
  });
});
