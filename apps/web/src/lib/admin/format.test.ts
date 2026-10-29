import { describe, it, expect } from "vitest";
import { formatCpf, isValidCpf, formatCnpj, formatBrl } from "./format";

describe("formatCpf", () => {
  it("formats an 11-digit CPF", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });
});

describe("isValidCpf", () => {
  it("accepts a structurally valid CPF (punctuated or not)", () => {
    expect(isValidCpf("52998224725")).toBe(true);
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });
  it("rejects bad check digits, wrong length and repeated runs", () => {
    expect(isValidCpf("12345678901")).toBe(false);
    expect(isValidCpf("111")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf(null)).toBe(false);
  });
});

describe("formatCnpj", () => {
  it("formats 14 digits", () => {
    expect(formatCnpj("00000000000100")).toBe("00.000.000/0001-00");
  });
  it("returns already-formatted input untouched", () => {
    expect(formatCnpj("00.000.000/0001-00")).toBe("00.000.000/0001-00");
  });
});

describe("formatBrl", () => {
  it("formats numbers and numeric strings", () => {
    expect(formatBrl(1840)).toContain("1.840");
    expect(formatBrl("1840")).toContain("1.840");
  });
  it("is empty for null/invalid", () => {
    expect(formatBrl(null)).toBe("");
    expect(formatBrl("abc")).toBe("");
  });
});
