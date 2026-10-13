import { describe, it, expect } from "vitest";
import {
  isPending,
  methodLabel,
  statusView,
  bankFieldOrder,
  PENDING_VALUE,
} from "./labels";
import type { BankDetailsUSD, BankDetailsEUR } from "./types";

describe("isPending", () => {
  it("detects the backend pending sentinel (trimmed)", () => {
    expect(isPending(PENDING_VALUE)).toBe(true);
    expect(isPending("  A confirmar  ")).toBe(true);
  });
  it("is false for real values and non-strings", () => {
    expect(isPending("1234 5678")).toBe(false);
    expect(isPending("")).toBe(false);
    expect(isPending(null)).toBe(false);
    expect(isPending(42)).toBe(false);
  });
});

describe("methodLabel", () => {
  it("maps known UI methods to pt-BR labels", () => {
    expect(methodLabel("USD_WIRE")).toBe("Dólar (USD) · Wire");
    expect(methodLabel("EUR_SEPA")).toBe("Euro (EUR) · SEPA");
  });
  it("falls back to the given fallback, then the raw value", () => {
    expect(methodLabel("USDT_TRON", "Cripto")).toBe("Cripto");
    expect(methodLabel("UNKNOWN_X")).toBe("UNKNOWN_X");
  });
});

describe("statusView", () => {
  it("maps known statuses with a tone", () => {
    expect(statusView("COMPLETED")).toEqual({ label: "Concluído", tone: "success" });
    expect(statusView("FAILED").tone).toBe("error");
    expect(statusView("PENDING_DEPOSIT").tone).toBe("neutral");
  });
  it("shows the raw value for unknown statuses", () => {
    expect(statusView("SOME_NEW_STATUS")).toEqual({
      label: "SOME_NEW_STATUS",
      tone: "neutral",
    });
  });
});

describe("bankFieldOrder", () => {
  it("orders EUR fields with IBAN/BIC and memo last", () => {
    const eur: BankDetailsEUR = {
      bankName: "B",
      iban: "DE00",
      bic: "XYZ",
      beneficiaryName: "N",
      wireMemo: "MEMO",
    };
    const keys = bankFieldOrder(eur).map((f) => f.key);
    expect(keys).toEqual(["beneficiaryName", "bankName", "iban", "bic", "wireMemo"]);
  });
  it("orders USD fields with routing/account and memo last", () => {
    const usd: BankDetailsUSD = {
      bankName: "B",
      routingNumber: "026",
      accountNumber: "123",
      swiftCode: "SW",
      beneficiaryName: "N",
      wireMemo: "MEMO",
    };
    const keys = bankFieldOrder(usd).map((f) => f.key);
    expect(keys[keys.length - 1]).toBe("wireMemo");
    expect(keys).toContain("routingNumber");
    expect(keys).toContain("accountNumber");
  });
});
