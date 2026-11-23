import { describe, expect, it } from "vitest";
import { COMPANY_DOC_MAX_BYTES } from "./constants";
import { COMPANY_COPY } from "./copy";
import {
  buildCompanyDocuments,
  buildCompanyLimits,
  resolveAveniaStatus,
} from "./fallback-adapter";
import {
  parseLimitsResponse,
  parseOnboardingStatus,
  validateCompanyDocumentFile,
} from "./validate";

describe("company parsers & file validation", () => {
  it("parses valid GET /v1/onboarding/status payload", () => {
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

    const docs = buildCompanyDocuments(parsed);
    const contrato = docs.find((d) => d.apiType === "CONTRATO_SOCIAL");
    const faturamento = docs.find((d) => d.apiType === "FATURAMENTO");
    expect(contrato?.status).toBe("Aprovado pela Avenia");
    expect(faturamento?.status).toBe("Pendente de envio");
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

    const docs = buildCompanyDocuments(parsed);
    const contrato = docs.find((d) => d.apiType === "CONTRATO_SOCIAL");
    expect(contrato?.status).toBe("Enviado — em análise pela Avenia");
  });

  it("parses GET /v1/limits and maps real Avenia limits with hybrid fallback", () => {
    const parsed = parseLimitsResponse({
      avenia: {
        blocked: false,
        byCurrency: [
          {
            currency: "*",
            fiatIn: { max: 500000, used: 100000, available: 400000 },
            fiatOut: { max: 200000, used: 50000, available: 150000 },
            chainIn: { max: null, used: null, available: null },
            chainOut: { max: null, used: null, available: null },
          },
          {
            currency: "BRL",
            fiatIn: { max: 300000, used: 75000, available: 225000 },
            fiatOut: { max: 300000, used: 25000, available: 275000 },
            chainIn: { max: null, used: null, available: null },
            chainOut: { max: null, used: null, available: null },
          },
        ],
      },
      aveniaReason: null,
      pixWithdrawal: null,
    });

    const rows = buildCompanyLimits(parsed);
    expect(rows.map((r) => r.label)).toEqual([
      "Global (USD)",
      "BRL",
      "USD",
      "EUR",
    ]);
    expect(rows[0]?.entry).toEqual({ used: 100000, max: 500000, unit: "USD" });
    expect(rows[1]?.exit).toEqual({ used: 25000, max: 300000, unit: "BRL" });
    // Missing USD/EUR rows fall back cleanly via hybrid adapter
    expect(rows[2]?.entry.max).toBeGreaterThan(0);
    expect(rows[3]?.entry.max).toBeGreaterThan(0);
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
