import { describe, it, expect } from "vitest";
import {
  accountFields,
  copyAllText,
  currencyTitle,
  sameDayCutoffLocalLabel,
  settlementFor,
} from "./account-content";
import type { DedicatedAccount } from "./types";
import type { NewAccountFieldLabels } from "./account-content";

const LABELS: NewAccountFieldLabels = {
  accountType: "Tipo de conta",
  bankAddress: "Endereço do banco",
  paymentRail: "Tipo de transferência",
  beneficiaryAddress: "Endereço do beneficiário",
  accountTypeChecking: "Corrente",
  accountTypeSavings: "Poupança",
};

// Reference instants well inside each US DST period (not near the transition).
const BEFORE_DST_END = new Date("2026-10-20T12:00:00Z"); // EDT (UTC-4)
const AFTER_DST_END = new Date("2026-11-15T12:00:00Z"); // EST (UTC-5)

describe("sameDayCutoffLocalLabel", () => {
  it("shows 16:45 in New York's own zone in both DST periods", () => {
    expect(sameDayCutoffLocalLabel(BEFORE_DST_END, "America/New_York")).toBe("16:45");
    expect(sameDayCutoffLocalLabel(AFTER_DST_END, "America/New_York")).toBe("16:45");
  });

  it("tracks US DST automatically in Rio Branco (UTC-5, no DST)", () => {
    // 16:45 EDT = 20:45 UTC -> 15:45 in Rio Branco; after DST ends, 16:45.
    expect(sameDayCutoffLocalLabel(BEFORE_DST_END, "America/Rio_Branco")).toBe("15:45");
    expect(sameDayCutoffLocalLabel(AFTER_DST_END, "America/Rio_Branco")).toBe("16:45");
  });

  it("tracks US DST in São Paulo (UTC-3, no DST in 2026)", () => {
    // 16:45 EDT = 20:45 UTC -> 17:45 in São Paulo; after DST ends, 18:45.
    expect(sameDayCutoffLocalLabel(BEFORE_DST_END, "America/Sao_Paulo")).toBe("17:45");
    expect(sameDayCutoffLocalLabel(AFTER_DST_END, "America/Sao_Paulo")).toBe("18:45");
  });
});

describe("settlementFor", () => {
  it("USD wire text carries the ET cutoff and local equivalent before DST ends", () => {
    const usd = settlementFor("USD", BEFORE_DST_END, "America/Rio_Branco");
    const wire = usd?.lines.find((l) => l.method === "Wire");
    expect(wire?.time).toContain("16:45 em Nova York (ET)");
    expect(wire?.time).toContain("15:45 no seu fuso");
    expect(wire?.time).toContain("até 2h");
    expect(usd?.note).toContain("dias úteis");
    expect(usd?.note).toContain("próximo dia útil");
  });

  it("omits the local parenthetical when the viewer is already on ET", () => {
    const usd = settlementFor("USD", AFTER_DST_END, "America/New_York");
    const wire = usd?.lines.find((l) => l.method === "Wire");
    expect(wire?.time).toContain("16:45 em Nova York (ET)");
    expect(wire?.time).not.toContain("no seu fuso");
  });

  it("returns SEPA for EUR and null for unknown currencies", () => {
    expect(settlementFor("EUR")?.lines[0]).toEqual({
      method: "SEPA",
      time: "1 a 2 dias úteis",
    });
    expect(settlementFor("GBP")).toBeNull();
  });
});

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
    const keys = accountFields(usd, LABELS).map((f) => f.key);
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
    const fields = accountFields(eur, LABELS);
    expect(fields.map((f) => f.key)).toEqual(["beneficiaryName", "iban", "swift"]);
    expect(fields.find((f) => f.key === "iban")?.label).toBe("IBAN");
  });

  it("USD account with the new fields shows them in order, with accountType translated", () => {
    const usd: DedicatedAccount = {
      currency: "USD",
      beneficiaryName: "ACME LTDA",
      bankName: "Modulus Bank",
      bankAddress: "123 Main St, New York, NY 10001, USA",
      accountNumber: "3123456789",
      routingNumber: "026073150",
      accountType: "CHECKING",
      paymentRail: "ACH / Wire",
    };
    const fields = accountFields(usd, LABELS);
    expect(fields.map((f) => f.key)).toEqual([
      "beneficiaryName",
      "bankName",
      "bankAddress",
      "accountNumber",
      "routingNumber",
      "accountType",
      "paymentRail",
    ]);
    expect(fields.find((f) => f.key === "accountType")?.value).toBe("Corrente");
    expect(fields.find((f) => f.key === "accountType")?.label).toBe("Tipo de conta");
    expect(fields.find((f) => f.key === "bankAddress")?.label).toBe("Endereço do banco");
  });

  it("translates SAVINGS and passes through unknown accountType values as-is", () => {
    const savings = accountFields(
      { currency: "USD", accountType: "SAVINGS" },
      LABELS,
    );
    expect(savings.find((f) => f.key === "accountType")?.value).toBe("Poupança");

    const unknown = accountFields(
      { currency: "USD", accountType: "JOINT" },
      LABELS,
    );
    expect(unknown.find((f) => f.key === "accountType")?.value).toBe("JOINT");
  });

  it("EUR account with beneficiaryAddress shows it right after beneficiaryName", () => {
    const eur: DedicatedAccount = {
      currency: "EUR",
      beneficiaryName: "ACME LTDA",
      beneficiaryAddress: "Av. Paulista, 1000, São Paulo, SP, Brasil",
      bankName: "Modulus Bank EU",
      iban: "DE00 0000",
      swift: "XYZ",
    };
    const fields = accountFields(eur, LABELS);
    expect(fields.map((f) => f.key)).toEqual([
      "beneficiaryName",
      "beneficiaryAddress",
      "bankName",
      "iban",
      "swift",
    ]);
  });

  it("omits the new fields entirely when the backend doesn't send them", () => {
    const usd: DedicatedAccount = {
      currency: "USD",
      beneficiaryName: "ACME LTDA",
      bankName: "Modulus Bank",
      accountNumber: "3123456789",
      routingNumber: "026073150",
    };
    const fields = accountFields(usd, LABELS);
    expect(fields.some((f) => ["accountType", "bankAddress", "paymentRail", "beneficiaryAddress"].includes(f.key))).toBe(false);
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
