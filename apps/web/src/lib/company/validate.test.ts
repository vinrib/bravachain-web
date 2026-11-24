import { afterEach, describe, expect, it, vi } from "vitest";
import * as clientApi from "@/lib/client-api";
import { uploadCompanyDocument } from "./api";
import { COMPANY_DOC_MAX_BYTES } from "./constants";
import { COMPANY_COPY } from "./copy";
import {
  mapCompanyDocuments,
  mapCompanyLimits,
  mapCompanyProfile,
  parseLimitsResponse,
  parseOnboardingCompany,
  parseOnboardingStatus,
  resolveAveniaStatus,
  validateCompanyDocumentFile,
} from "./validate";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("company parsers, mappers & upload validation", () => {
  it("strictly validates GET /v1/onboarding/company (exactly 3 keys: legalName, cnpj, cnae)", () => {
    expect(
      parseOnboardingCompany({
        legalName: "Exportadora Brasil Ltda",
        cnpj: "12345678000199",
        cnae: "46.37-1-99",
      }),
    ).toEqual({
      legalName: "Exportadora Brasil Ltda",
      cnpj: "12345678000199",
      cnae: "46.37-1-99",
    });

    expect(
      parseOnboardingCompany({
        legalName: null,
        cnpj: null,
        cnae: null,
      }),
    ).toEqual({
      legalName: null,
      cnpj: null,
      cnae: null,
    });

    // Extra key -> error (null)
    expect(
      parseOnboardingCompany({
        legalName: "Exportadora Brasil Ltda",
        cnpj: "12345678000199",
        cnae: "46.37-1-99",
        extraKey: "unexpected",
      }),
    ).toBeNull();

    // Missing key -> error (null)
    expect(
      parseOnboardingCompany({
        legalName: "Exportadora Brasil Ltda",
        cnpj: "12345678000199",
      }),
    ).toBeNull();

    // Wrong value type -> error (null)
    expect(
      parseOnboardingCompany({
        legalName: 123,
        cnpj: null,
        cnae: null,
      }),
    ).toBeNull();

    expect(parseOnboardingCompany(null)).toBeNull();
    expect(parseOnboardingCompany([])).toBeNull();
  });

  it("parses valid GET /v1/onboarding/status payload and derives real status without per-document approval", () => {
    const parsed = parseOnboardingStatus({
      kybStatus: "APPROVED",
      kybSubmittedAt: "2026-10-12T14:00:00Z",
      kybApprovedAt: "2026-10-13T16:00:00Z",
      kybRejectedReason: null,
      documents: [
        {
          id: "doc-1",
          type: "CONTRATO_SOCIAL",
          fileName: "contrato.pdf",
          fileSizeKb: 250,
          uploadedAt: "2026-10-12T14:00:00Z",
        },
      ],
      missingDocuments: ["FATURAMENTO"],
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.kybStatus).toBe("APPROVED");
    expect(parsed?.documents).toHaveLength(1);
    expect(parsed?.missingDocuments).toEqual(["FATURAMENTO"]);
    expect(resolveAveniaStatus(parsed)).toEqual({
      kind: "approved",
      label: "Aprovado pela Avenia",
    });

    const docs = mapCompanyDocuments(parsed);
    expect(docs).toHaveLength(2);
    const contrato = docs.find((d) => d.apiType === "CONTRATO_SOCIAL");
    const faturamento = docs.find((d) => d.apiType === "FATURAMENTO");
    expect(contrato?.kind).toBe("uploaded");
    expect(contrato?.statusLabel).toBe("Enviado em 12/10");
    expect(faturamento?.kind).toBe("pending");
    expect(faturamento?.statusLabel).toBe("Pendente de envio");
  });

  it("never assumes approved when onboarding is null and returns zero documents", () => {
    expect(resolveAveniaStatus(null)).toEqual({
      kind: "unavailable",
      label: "Status indisponível no momento",
    });
    expect(mapCompanyDocuments(null)).toEqual([]);
  });

  it("never marks uploaded documents as approved when kybStatus is SUBMITTED", () => {
    const parsed = parseOnboardingStatus({
      kybStatus: "SUBMITTED",
      kybSubmittedAt: "2026-10-12T14:00:00Z",
      kybApprovedAt: null,
      kybRejectedReason: null,
      documents: [
        {
          id: "doc-1",
          type: "CONTRATO_SOCIAL",
          fileName: "contrato.pdf",
          fileSizeKb: 100,
          uploadedAt: "2026-10-12T14:00:00Z",
        },
      ],
      missingDocuments: [],
    });

    const docs = mapCompanyDocuments(parsed);
    expect(docs).toHaveLength(1);
    expect(docs[0]?.statusLabel).toBe("Enviado em 12/10");
  });

  it("parses GET /v1/limits with period, referenceMonth, unlocked, and usedPct without inventing missing currencies", () => {
    const parsed = parseLimitsResponse({
      avenia: {
        blocked: false,
        byCurrency: [
          {
            currency: "*",
            period: "monthly",
            referenceMonth: "2026-11",
            unlocked: true,
            fiatIn: { max: 500000, used: 215000, available: 285000, usedPct: "43.00" },
            fiatOut: { max: 200000, used: 0, available: 200000, usedPct: "0.00" },
            chainIn: { max: null, used: null, available: null, usedPct: null },
            chainOut: { max: null, used: null, available: null, usedPct: null },
          },
          {
            currency: "BRL",
            period: "monthly",
            referenceMonth: null,
            unlocked: null,
            fiatIn: { max: 300000, used: 450000, available: 0, usedPct: "150.00" },
            fiatOut: { max: 300000, used: 25000, available: 275000, usedPct: null },
            chainIn: { max: null, used: null, available: null, usedPct: null },
            chainOut: { max: null, used: null, available: null, usedPct: null },
          },
          {
            currency: "EUR",
            period: "monthly",
            referenceMonth: "2026-11",
            unlocked: false,
            fiatIn: { max: null, used: null, available: null, usedPct: null },
            fiatOut: { max: null, used: null, available: null, usedPct: null },
            chainIn: { max: null, used: null, available: null, usedPct: null },
            chainOut: { max: null, used: null, available: null, usedPct: null },
          },
        ],
      },
      aveniaReason: null,
      pixWithdrawal: null,
    });

    const rows = mapCompanyLimits(parsed);
    // USD was not returned and must NOT be invented
    expect(rows.map((r) => r.label)).toEqual(["Global (USD)", "BRL", "EUR"]);
    expect(rows[0]).toMatchObject({
      period: "monthly",
      referenceMonth: "2026-11",
      unlocked: true,
      entry: { used: 215000, max: 500000, usedPct: "43.00", unit: "USD" },
      exit: { used: 0, max: 200000, usedPct: "0.00", unit: "USD" },
    });
    expect(rows[1]).toMatchObject({
      period: "monthly",
      referenceMonth: null,
      unlocked: null,
      entry: { used: 450000, max: 300000, usedPct: "150.00", unit: "BRL" },
      exit: { used: 25000, max: 300000, usedPct: null, unit: "BRL" },
    });
    expect(rows[2]).toMatchObject({
      scope: "EUR",
      unlocked: false,
    });
    expect(mapCompanyLimits(null)).toEqual([]);
  });

  it("maps profile strictly from GET /v1/onboarding/company and /auth/me without inventing missing fields", () => {
    expect(
      mapCompanyProfile({ company: null, me: null, onboarding: null }),
    ).toBeNull();

    // If /v1/onboarding/company failed, mapCompanyProfile returns null even if /auth/me exists
    expect(
      mapCompanyProfile({
        company: null,
        me: {
          id: "u1",
          email: "real@empresa.com.br",
          name: "Pessoa Real",
          kycStatus: "PENDING",
        },
        onboarding: null,
      }),
    ).toBeNull();

    const profileWithNulls = mapCompanyProfile({
      company: {
        legalName: null,
        cnpj: null,
        cnae: null,
      },
      me: {
        id: "u1",
        email: "real@empresa.com.br",
        name: "Pessoa Real",
        kycStatus: "PENDING",
      },
      onboarding: null,
    });

    expect(profileWithNulls).toEqual({
      legalName: null,
      cnpj: null,
      cnae: null,
      email: "real@empresa.com.br",
      aveniaStatusKind: "unavailable",
      aveniaStatusLabel: "Status indisponível no momento",
    });

    const fullProfile = mapCompanyProfile({
      company: {
        legalName: "Exportadora Real Ltda",
        cnpj: "12345678000199",
        cnae: "46.37-1-99",
      },
      me: {
        id: "u1",
        email: "real@empresa.com.br",
        name: "Pessoa Real",
        kycStatus: "APPROVED",
      },
      onboarding: null,
    });

    expect(fullProfile).toEqual({
      legalName: "Exportadora Real Ltda",
      cnpj: "12.345.678/0001-99",
      cnae: "46.37-1-99",
      email: "real@empresa.com.br",
      aveniaStatusKind: "unavailable",
      aveniaStatusLabel: "Status indisponível no momento",
    });
  });

  it("rejects uploads for unmapped document types and uses real POST response body for mapped types", async () => {
    const pdf = new File(["%PDF-1.4"], "doc.pdf", { type: "application/pdf" });

    await expect(
      uploadCompanyDocument(
        {
          id: "CUSTOM_DOC",
          apiType: null,
          name: "Custom doc",
          category: "Cadastro societário",
          fileName: null,
          uploadedAtLabel: null,
          uploadedDayMonthLabel: null,
          kind: "pending",
          statusLabel: "Pendente de envio",
        },
        pdf,
      ),
    ).rejects.toThrow(/Upload não suportado/);

    vi.spyOn(clientApi, "apiFetch").mockResolvedValueOnce({
      documentId: "real-doc-id-99",
      type: "FATURAMENTO",
      fileName: "FATURAMENTO_1700000.pdf",
      fileSizeKb: 42,
      uploadedAt: "2026-10-15T01:30:00.000Z",
    });

    const uploaded = await uploadCompanyDocument(
      {
        id: "FATURAMENTO",
        apiType: "FATURAMENTO",
        name: "Balanço Patrimonial / DRE (Último Exercício)",
        category: "Demonstrações financeiras",
        fileName: null,
        uploadedAtLabel: null,
        uploadedDayMonthLabel: null,
        kind: "pending",
        statusLabel: "Pendente de envio",
      },
      pdf,
    );

    expect(uploaded.id).toBe("real-doc-id-99");
    expect(uploaded.fileName).toBe("FATURAMENTO_1700000.pdf");
    expect(uploaded.kind).toBe("uploaded");
    expect(uploaded.statusLabel).toBe("Enviado em 14/10");
  });

  it("validates upload MIME type and 10MB max size", () => {
    expect(
      validateCompanyDocumentFile({
        name: "dre.pdf",
        type: "application/pdf",
        size: 1024,
      }),
    ).toBeNull();
    expect(
      validateCompanyDocumentFile({
        name: "rg.png",
        type: "image/png",
        size: 2048,
      }),
    ).toBeNull();
    expect(
      validateCompanyDocumentFile({
        name: "planilha.xlsx",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 1024,
      }),
    ).toBe(COMPANY_COPY.documents.errors.invalidType);
    expect(
      validateCompanyDocumentFile({
        name: "grande.pdf",
        type: "application/pdf",
        size: COMPANY_DOC_MAX_BYTES + 1,
      }),
    ).toBe(COMPANY_COPY.documents.errors.fileTooLarge);
    expect(
      validateCompanyDocumentFile({
        name: "vazio.pdf",
        type: "application/pdf",
        size: 0,
      }),
    ).toBe(COMPANY_COPY.documents.errors.emptyFile);
  });
});
