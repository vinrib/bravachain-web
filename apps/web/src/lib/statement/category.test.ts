import { describe, it, expect } from "vitest";
import { parseCategory, categoryLabel, categoryDirection } from "./category";

describe("parseCategory", () => {
  it("accepts the four known categories", () => {
    expect(parseCategory("DEPOSIT")).toBe("DEPOSIT");
    expect(parseCategory("WITHDRAWAL")).toBe("WITHDRAWAL");
    expect(parseCategory("REVERSAL")).toBe("REVERSAL");
    expect(parseCategory("ADJUSTMENT")).toBe("ADJUSTMENT");
  });

  it("returns null for unknown/absent values (optional until PR #56)", () => {
    expect(parseCategory(undefined)).toBe(null);
    expect(parseCategory(null)).toBe(null);
    expect(parseCategory("")).toBe(null);
    expect(parseCategory("deposit")).toBe(null); // case-sensitive
    expect(parseCategory("TRANSFER")).toBe(null);
    expect(parseCategory(123)).toBe(null);
  });
});

describe("categoryLabel", () => {
  it("labels in pt/en/es", () => {
    expect(categoryLabel("DEPOSIT", "pt")).toBe("Depósito");
    expect(categoryLabel("WITHDRAWAL", "pt")).toBe("Saque");
    expect(categoryLabel("REVERSAL", "pt")).toBe("Estorno");
    expect(categoryLabel("ADJUSTMENT", "pt")).toBe("Ajuste de conciliação");

    expect(categoryLabel("DEPOSIT", "en")).toBe("Deposit");
    expect(categoryLabel("REVERSAL", "en")).toBe("Reversal");
    expect(categoryLabel("ADJUSTMENT", "en")).toBe("Reconciliation adjustment");

    expect(categoryLabel("WITHDRAWAL", "es")).toBe("Retiro");
    expect(categoryLabel("ADJUSTMENT", "es")).toBe("Ajuste de conciliación");
  });

  it("defaults to pt", () => {
    expect(categoryLabel("REVERSAL")).toBe("Estorno");
  });
});

describe("categoryDirection", () => {
  it("maps category to direction; REVERSAL/ADJUSTMENT are neutral", () => {
    expect(categoryDirection("DEPOSIT", "INBOUND")).toBe("in");
    expect(categoryDirection("WITHDRAWAL", "WITHDRAWAL")).toBe("out");
    expect(categoryDirection("REVERSAL", "INBOUND")).toBe("neutral");
    expect(categoryDirection("ADJUSTMENT", "WITHDRAWAL")).toBe("neutral");
  });

  it("falls back to the legacy type when category is absent", () => {
    expect(categoryDirection(null, "INBOUND")).toBe("in");
    expect(categoryDirection(null, "WITHDRAWAL")).toBe("out");
  });
});
