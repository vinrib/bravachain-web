import { describe, it, expect } from "vitest";
import {
  accountFields,
  copyAllText,
  currencyTitle,
} from "./account-content";
import type { DedicatedAccount } from "./types";

describe("accountFields", () => {
  it("returns only present fields, in display order", () => {
    const usd: DedicatedAccount = {
      currency: "USD",
      beneficiaryName: "ACME LTDA",
      bankName: "Modulus Bank",
      accountNumber: "3123456789",
      routingNumber: "026073150",
      swift: "",
      reference: "   ",
      confirmedAt: "2026-10-01T00:00:00Z",
    };
    const keys = accountFields(usd).map((f) => f.key);
    // swift (empty) and reference (whitespace) are dropped; order preserved.
    expect(keys).toEqual([
      "beneficiaryName",
      "bankName",
      "accountNumber",
      "routingNumber",
    ]);
  });

  it("maps EUR fields (IBAN) and labels them", () => {
    const eur: DedicatedAccount = {
      currency: "EUR",
      beneficiaryName: "ACME LTDA",
      iban: "DE00 0000",
      swift: "XYZ",
    };
    const fields = accountFields(eur);
    expect(fields.map((f) => f.key)).toEqual(["beneficiaryName", "iban", "swift"]);
    expect(fields.find((f) => f.key === "iban")?.label).toBe("IBAN");
  });
});

describe("copyAllText", () => {
  it("joins label: value lines", () => {
    const text = copyAllText([
      { key: "beneficiaryName", label: "Titular", value: "ACME" },
      { key: "iban", label: "IBAN", value: "DE00" },
    ]);
    expect(text).toBe("Titular: ACME\nIBAN: DE00");
  });
});

describe("currencyTitle", () => {
  it("names USD/EUR and falls back for others", () => {
    expect(currencyTitle("USD")).toBe("Conta em dólar (USD)");
    expect(currencyTitle("EUR")).toBe("Conta em euro (EUR)");
    expect(currencyTitle("GBP")).toBe("Conta em GBP");
  });
});
