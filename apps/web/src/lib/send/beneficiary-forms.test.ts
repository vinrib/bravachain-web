import { describe, it, expect } from "vitest";
import { MASKS, validateForm, ERR } from "./beneficiary-forms";

describe("MASKS", () => {
  it("formats CPF and CNPJ", () => {
    expect(MASKS.doc("12345678901")).toBe("123.456.789-01");
    expect(MASKS.doc("12345678000190")).toBe("12.345.678/0001-90");
  });
  it("groups IBAN in 4s and uppercases", () => {
    expect(MASKS.iban("de8937040044053201 3000")).toBe("DE89 3704 0044 0532 0130 00");
  });
  it("limits digit masks", () => {
    expect(MASKS.d9("12345678901")).toBe("123456789");
    expect(MASKS.bic("bnpafrpp")).toBe("BNPAFRPP");
  });
});

describe("validateForm — shape only, no 'our' limit", () => {
  it("flags an invalid Pix e-mail key against the selected key type", () => {
    const errors = validateForm("pix", { nm: "X", tk: "E-mail", ch: "not-an-email" });
    expect(errors).toEqual({ ch: ERR.email });
  });

  it("accepts a valid CPF Pix key", () => {
    const errors = validateForm("pix", { nm: "X", tk: "CPF/CNPJ", ch: "12345678901" });
    expect(errors).toEqual({});
  });

  it("flags an invalid CPF/CNPJ on the bank-account form", () => {
    const errors = validateForm("conta", { nm: "X", doc: "123", ag: "0412", cc: "33871-2" });
    expect(errors.doc).toBe(ERR.cpfCnpj);
  });

  it("flags a short ABA routing number (USD Wire)", () => {
    const errors = validateForm("USD", {
      nm: "X", bk: "Lead Bank", rt: "123", ac: "1234", rua: "1 Main", cid: "KC", uf: "MO", zip: "64108",
    });
    expect(errors.rt).toBe(ERR.aba);
  });

  it("flags an invalid IBAN but accepts an empty optional BIC (EUR SEPA)", () => {
    const errors = validateForm("EUR", {
      nm: "X", iban: "XX00", bic: "", bk: "BNP", cid: "Lyon", rua: "12 Rue", zip: "69002",
    });
    expect(errors.iban).toBe(ERR.iban);
    expect(errors.bic).toBeUndefined();
  });

  it("flags required fields when empty", () => {
    const errors = validateForm("pix", {});
    expect(errors.nm).toBe(ERR.required);
    expect(errors.ch).toBe(ERR.required);
  });
});
