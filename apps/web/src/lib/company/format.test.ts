import { describe, expect, it } from "vitest";
import {
  computeLimitBarScale,
  formatCnpj,
  formatCompanyDateBr,
  formatCompanyDayMonthBr,
  formatLimitAmountPtBr,
  formatReferenceMonthPtBr,
  formatUsedPctPtBr,
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

  it("formats backend usedPct strings in pt-BR without float math", () => {
    expect(formatUsedPctPtBr("43.00")).toBe("43,00%");
    expect(formatUsedPctPtBr("0.00")).toBe("0,00%");
    expect(formatUsedPctPtBr("150.00")).toBe("150,00%");
    expect(formatUsedPctPtBr("1250.50")).toBe("1.250,50%");
    expect(formatUsedPctPtBr(null)).toBeNull();
    expect(formatUsedPctPtBr("")).toBeNull();
    expect(formatUsedPctPtBr("abc")).toBeNull();
  });

  it("computes visual-only progress bar scale clamped to 100 and flags > 100%", () => {
    expect(computeLimitBarScale("43.00")).toEqual({
      widthPct: 43,
      exceeded: false,
    });
    expect(computeLimitBarScale("0.00")).toEqual({
      widthPct: 0,
      exceeded: false,
    });
    expect(computeLimitBarScale("100.00")).toEqual({
      widthPct: 100,
      exceeded: false,
    });
    expect(computeLimitBarScale("150.00")).toEqual({
      widthPct: 100,
      exceeded: true,
    });
    expect(computeLimitBarScale(null)).toBeNull();
    expect(computeLimitBarScale("invalid")).toBeNull();
  });

  it("formats referenceMonth YYYY-MM by string split without Date or assuming current month", () => {
    expect(formatReferenceMonthPtBr("2026-11")).toBe("Uso mensal · nov/26");
    expect(formatReferenceMonthPtBr("2026-01")).toBe("Uso mensal · jan/26");
    expect(formatReferenceMonthPtBr("2027-12")).toBe("Uso mensal · dez/27");
    expect(formatReferenceMonthPtBr(null)).toBe(
      "Uso mensal · mês de referência não informado",
    );
    expect(formatReferenceMonthPtBr("2026-13")).toBe(
      "Uso mensal · mês de referência não informado",
    );
    expect(formatReferenceMonthPtBr("invalid")).toBe(
      "Uso mensal · mês de referência não informado",
    );
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
