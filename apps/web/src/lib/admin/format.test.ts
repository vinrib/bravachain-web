import { describe, it, expect } from "vitest";
import { formatCpf, maskCpf, formatCnpj, formatBrl } from "./format";

describe("formatCpf / maskCpf", () => {
  it("formats an 11-digit CPF", () => {
    expect(formatCpf("12345678901")).toBe("123.456.789-01");
  });
  it("masks all but the last two digits", () => {
    expect(maskCpf("12345678901")).toBe("•••.•••.•••-01");
  });
  it("never exposes digits for a malformed CPF", () => {
    expect(maskCpf("123")).toBe("•••.•••.•••-••");
    expect(maskCpf(null)).toBe("•••.•••.•••-••");
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
