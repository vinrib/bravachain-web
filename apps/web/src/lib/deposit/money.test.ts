import { describe, it, expect } from "vitest";
import { formatBrlDecimal } from "./money";

describe("formatBrlDecimal", () => {
  it("formats a decimal string as pt-BR currency", () => {
    // Non-breaking space between "R$" and the number in pt-BR output.
    expect(formatBrlDecimal("1234.56")).toBe("R$ 1.234,56");
    expect(formatBrlDecimal("0.5")).toBe("R$ 0,50");
    expect(formatBrlDecimal("1000000")).toBe("R$ 1.000.000,00");
  });

  it("accepts a plain integer string", () => {
    expect(formatBrlDecimal("10")).toBe("R$ 10,00");
  });

  it("returns null for absent values (undefined/null/empty) — UI omits the line", () => {
    expect(formatBrlDecimal(undefined)).toBe(null);
    expect(formatBrlDecimal(null)).toBe(null);
    expect(formatBrlDecimal("")).toBe(null);
    expect(formatBrlDecimal("   ")).toBe(null);
  });

  it("returns null for non-numeric strings instead of throwing", () => {
    expect(formatBrlDecimal("abc")).toBe(null);
    expect(formatBrlDecimal("R$ 12,34")).toBe(null);
  });
});
