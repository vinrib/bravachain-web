import { describe, expect, it } from "vitest";
import { COMPANY_COPY } from "./copy";

const PROHIBITED_PATTERNS: RegExp[] = [
  /c[âa]mbio/i,
  /\bspread\b/i,
  /taxa\s+de\s+convers[aã]o/i,
  /estamos\s+analisando/i,
  /\b(aprovamos|reprovamos|analisamos|liberamos)\b/i,
  /clientes\s+em\s+revis[aã]o/i,
  /fila\s+de\s+revis[aã]o/i,
  /revis[aã]o\s+de\s+compliance/i,
  /aprovar\s+cliente/i,
  /reprovar\s+cliente/i,
  // Explicitly prohibited compliance/screening jargon for the Empresa screen
  /\bCOAF\b/i,
  /\bOFAC\b/i,
  /\bONU\b/i,
  /\bEDD\b/i,
  /\bRADAR\b/i,
  /\bTier\b/i,
  /\bscreening\b/i,
  /\bKYB\b/i,
];

function collectLeafStrings(
  node: unknown,
  path: string,
  out: Array<{ path: string; text: string }>,
): void {
  if (typeof node === "string") {
    out.push({ path, text: node });
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      collectLeafStrings(v, path ? `${path}.${k}` : k, out);
    }
  }
}

const entries: Array<{ path: string; text: string }> = [];
collectLeafStrings(COMPANY_COPY, "COMPANY_COPY", entries);

describe("COMPANY_COPY regulatory & compliance policy", () => {
  it("centralizes all UI strings", () => {
    expect(entries.length).toBeGreaterThan(25);
  });

  it("matches every mandatory client-facing string verbatim", () => {
    expect(COMPANY_COPY.page.title).toBe("Empresa");
    expect(COMPANY_COPY.pep.title).toBe(
      "Declaração de PEP dos sócios e beneficiários finais",
    );
    expect(COMPANY_COPY.pep.statusNotPep).toBe("Declaração registrada");
    expect(COMPANY_COPY.pep.statusIsPep).toBe(
      "Informação enviada à Avenia para análise",
    );
    expect(COMPANY_COPY.pep.declarationCheckbox).toBe(
      "Declaro que as informações sobre a condição de Pessoa Politicamente Exposta (PEP) dos representantes e beneficiários finais estão corretas e atualizadas.",
    );
    expect(COMPANY_COPY.documents.status.approved).toBe("Aprovado pela Avenia");
    expect(COMPANY_COPY.documents.status.pending).toBe("Pendente de envio");
    expect(COMPANY_COPY.documents.status.inAnalysis).toBe(
      "Enviado — em análise pela Avenia",
    );
    expect(COMPANY_COPY.documents.toastUploaded).toBe(
      "Documento enviado. A análise é feita pela Avenia.",
    );
    expect(COMPANY_COPY.limits.title).toBe("Limites da sua conta");
    expect(COMPANY_COPY.limits.subtitle).toBe("Limites definidos pela Avenia.");
    expect(COMPANY_COPY.limits.reviewAction).toBe("Como revisar meus limites");
    expect(COMPANY_COPY.limits.modal.description).toBe(
      "A revisão de limites é decidida pela Avenia. Mantenha seus documentos e demonstrações financeiras atualizados na aba Documentos.",
    );
  });

  for (const pattern of PROHIBITED_PATTERNS) {
    it(`never matches prohibited pattern ${pattern.toString()}`, () => {
      const hits = entries.filter(({ text }) => pattern.test(text));
      expect(hits).toEqual([]);
    });
  }
});
