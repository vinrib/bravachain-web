import { describe, expect, it } from "vitest";
import { COMPANY_COPY } from "./copy";

/**
 * 13 regulatory prohibited client-text patterns copied verbatim from
 * `bravachain-api/src/common/client-text-policy.ts` (`PROHIBITED_CLIENT_TEXT_PATTERNS`).
 */
const PROHIBITED_CLIENT_TEXT_PATTERNS: RegExp[] = [
  /c[âa]mbio/i,
  /\bspread\b/i,
  /taxa\s+de\s+convers[aã]o/i,
  /validade\s+legal/i,
  /\bsegundos\b/i,
  /em\s+tempo\s+real/i,
  /\btempo\s+real\b/i,
  /instant[âa]ne/i,
  /garantid[ao]/i,
  /melhor\s+taxa/i,
  /sem\s+custo/i,
  /autorizad[ao][^.\n]{0,40}banco\s+central/i,
  /\b(aprovamos|analisamos|liberamos)\b/i,
];

/** Additional web-specific & Empresa compliance/screening jargon prohibitions. */
const EXTRA_PROHIBITED_PATTERNS: RegExp[] = [
  /estamos\s+analisando/i,
  /\breprovamos\b/i,
  /clientes\s+em\s+revis[aã]o/i,
  /fila\s+de\s+revis[aã]o/i,
  /revis[aã]o\s+de\s+compliance/i,
  /aprovar\s+cliente/i,
  /reprovar\s+cliente/i,
  /\bCOAF\b/i,
  /\bOFAC\b/i,
  /\bONU\b/i,
  /\bEDD\b/i,
  /\bRADAR\b/i,
  /\bTier\b/i,
  /\bscreening\b/i,
  /\bKYB\b/i,
];

const MISSING_ACCENT_WORDS = [
  "media",
  "medias",
  "ultimo",
  "ultima",
  "ultimos",
  "ultimas",
  "util",
  "uteis",
  "nao",
  "diario",
  "diaria",
  "diarios",
  "diarias",
  "aritmetica",
  "aritmetico",
  "provisorio",
  "provisoria",
  "historico",
  "calculo",
  "calculos",
  "mes",
  "referencia",
  "disponivel",
  "disponiveis",
  "possivel",
  "analise",
  "declaracao",
  "informacao",
  "informacoes",
  "societario",
  "revisao",
  "saida",
  "pendencia",
  "pendencias",
  "razao",
  "numero",
  "codigo",
  "maximo",
  "minimo",
  "socio",
  "socios",
  "beneficiario",
  "beneficiarios",
  "estao",
  "tambem",
  "sera",
  "serao",
  "voce",
  "apos",
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

  it("matches every mandatory client-facing string verbatim and excludes fictional/misleading copy", () => {
    expect(COMPANY_COPY.page.title).toBe("Empresa");
    expect(COMPANY_COPY.page.retryAction).toBe("Tentar de novo");
    expect(COMPANY_COPY.aveniaStatus.approved).toBe("Aprovado pela Avenia");
    expect(COMPANY_COPY.aveniaStatus.unavailable).toBe(
      "Status indisponível no momento",
    );

    // Profile labels: "Nome da empresa", "CNPJ", "CNAE" — NEVER "Razão Social"
    expect(COMPANY_COPY.profile.fields.legalName).toBe("Nome da empresa");
    expect(COMPANY_COPY.profile.fields.cnpj).toBe("CNPJ");
    expect(COMPANY_COPY.profile.fields.cnae).toBe("CNAE");
    expect(JSON.stringify(COMPANY_COPY)).not.toContain("Razão Social");
    expect(JSON.stringify(COMPANY_COPY)).not.toContain("Empresa Exemplo");
    expect(JSON.stringify(COMPANY_COPY)).not.toContain("00.000.000/0001-00");

    expect(COMPANY_COPY.pep.title).toBe(
      "Declaração de PEP dos sócios e beneficiários finais",
    );
    expect(COMPANY_COPY.pep.declarationCheckbox).toBe(
      "Declaro que as informações sobre a condição de Pessoa Politicamente Exposta (PEP) dos representantes e beneficiários finais estão corretas e atualizadas.",
    );
    // PEP must never claim submission to Avenia while stubbed
    expect(JSON.stringify(COMPANY_COPY.pep)).not.toContain(
      "Informação enviada à Avenia",
    );
    // Per-document statuses never claim "Aprovado pela Avenia"
    expect(JSON.stringify(COMPANY_COPY.documents.status)).not.toContain(
      "Aprovado pela Avenia",
    );
    expect(COMPANY_COPY.documents.status.uploadedPrefix).toBe("Enviado em");
    expect(COMPANY_COPY.documents.status.pending).toBe("Pendente de envio");
    expect(COMPANY_COPY.documents.toastUploaded).toBe(
      "Documento enviado. A análise é feita pela Avenia.",
    );
    // Limits copy has no dead "Não informado pela Avenia" string
    expect(JSON.stringify(COMPANY_COPY.limits)).not.toContain(
      "Não informado pela Avenia",
    );
    expect(COMPANY_COPY.limits.title).toBe("Limites da sua conta");
    expect(COMPANY_COPY.limits.subtitle).toBe("Limites definidos pela Avenia.");
    expect(COMPANY_COPY.limits.reviewAction).toBe("Como revisar meus limites");
    expect(COMPANY_COPY.limits.modal.description).toBe(
      "A revisão de limites é decidida pela Avenia. Mantenha seus documentos e demonstrações financeiras atualizados na aba Documentos.",
    );
    expect(COMPANY_COPY.limits.monthlyPeriodPrefix).toBe("Uso mensal");
    expect(COMPANY_COPY.limits.monthlyPeriodUnknown).toBe(
      "Uso mensal · mês de referência não informado",
    );
    expect(COMPANY_COPY.limits.currencyLocked).toBe(
      "Moeda ainda não habilitada",
    );
    expect(COMPANY_COPY.limits.notApproved).toBe(
      "Os limites ficam disponíveis depois que a Avenia aprovar o cadastro.",
    );
  });

  it("checks all 13 client-text-policy patterns", () => {
    expect(PROHIBITED_CLIENT_TEXT_PATTERNS).toHaveLength(13);
  });

  for (const pattern of PROHIBITED_CLIENT_TEXT_PATTERNS) {
    it(`never matches client-text-policy pattern ${pattern.toString()}`, () => {
      const hits = entries.filter(({ text }) => pattern.test(text));
      expect(hits).toEqual([]);
    });
  }

  it("never combines all copy strings into any prohibited phrase across boundaries", () => {
    const joined = entries.map((e) => e.text).join(" | ");
    for (const pattern of PROHIBITED_CLIENT_TEXT_PATTERNS) {
      expect(pattern.test(joined)).toBe(false);
    }
  });

  for (const pattern of EXTRA_PROHIBITED_PATTERNS) {
    it(`never matches prohibited pattern ${pattern.toString()}`, () => {
      const hits = entries.filter(({ text }) => pattern.test(text));
      expect(hits).toEqual([]);
    });
  }

  for (const word of MISSING_ACCENT_WORDS) {
    it(`never uses the unaccented pt-BR word "${word}"`, () => {
      const re = new RegExp(`\\b${word}\\b`, "i");
      const hits = entries.filter(({ text }) => re.test(text));
      expect(hits).toEqual([]);
    });
  }
});
