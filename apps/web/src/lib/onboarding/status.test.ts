import { describe, it, expect } from "vitest";
import { documentTypeLabel } from "./status";

describe("documentTypeLabel", () => {
  it("maps known KYB document types to readable PT labels", () => {
    expect(documentTypeLabel("SOCIAL_CONTRACT")).toBe("Contrato social");
    expect(documentTypeLabel("CNPJ_CARD")).toBe("Cartão CNPJ");
    expect(documentTypeLabel("PROOF_OF_ADDRESS")).toBe("Comprovante de endereço");
    expect(documentTypeLabel("IDENTITY")).toBe("Documento de identidade");
    expect(documentTypeLabel("SELFIE")).toBe("Selfie de verificação");
  });

  it("is case-insensitive on known keys", () => {
    expect(documentTypeLabel("social_contract")).toBe("Contrato social");
    expect(documentTypeLabel("identity")).toBe("Documento de identidade");
  });

  it("humanizes unknown types instead of inventing a label", () => {
    expect(documentTypeLabel("POWER_BILL")).toBe("Power bill");
    expect(documentTypeLabel("bank-statement")).toBe("Bank statement");
  });

  it("falls back to a generic label for empty/garbage input", () => {
    expect(documentTypeLabel("")).toBe("Documento");
    expect(documentTypeLabel("___")).toBe("Documento");
  });
});
