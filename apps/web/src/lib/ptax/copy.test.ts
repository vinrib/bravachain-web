import { describe, expect, it } from "vitest";
import { PTAX_COPY } from "./copy";

/**
 * Regulatory prohibited client-text patterns copied verbatim from
 * `bravachain-api/src/common/client-text-policy.ts` (`PROHIBITED_CLIENT_TEXT_PATTERNS`),
 * plus web-specific forbidden review terms from `apps/web/src/locales/forbidden-terms.test.ts`.
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

const allCopyEntries: Array<{ path: string; text: string }> = [];
collectLeafStrings(PTAX_COPY, "PTAX_COPY", allCopyEntries);

describe("PTAX_COPY regulatory text policy compliance", () => {
  const entries = allCopyEntries;

  it("has centralized copy strings to scan", () => {
    expect(entries.length).toBeGreaterThan(30);
  });

  it("displays the exact required BCB PTAX attribution", () => {
    expect(PTAX_COPY.page.sourceLine).toBe(
      "Fonte: Banco Central do Brasil — PTAX",
    );
  });

  for (const pattern of PROHIBITED_CLIENT_TEXT_PATTERNS) {
    it(`never matches prohibited pattern ${pattern.toString()}`, () => {
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
});

/**
 * PR #40 visual-review fix: the "Como é calculado" methodology text leaked
 * raw backend identifiers (ROUND_HALF_UP, average12m) and several unaccented
 * pt-BR words because it was the API's raw `method` string, not PTAX_COPY.
 * These guard rails make sure that never happens again from this file.
 */
const FORBIDDEN_CODE_IDENTIFIER_PATTERNS: RegExp[] = [
  /ROUND_/,
  /average12m/i,
  /[a-z]+_[a-z]+/,
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
];

describe("PTAX_COPY never leaks code identifiers or unaccented pt-BR words", () => {
  const entries = allCopyEntries;

  for (const pattern of FORBIDDEN_CODE_IDENTIFIER_PATTERNS) {
    it(`never matches code-identifier pattern ${pattern.toString()}`, () => {
      const hits = entries.filter(({ text }) => pattern.test(text));
      expect(hits).toEqual([]);
    });
  }

  for (const word of MISSING_ACCENT_WORDS) {
    it(`never uses the unaccented word "${word}"`, () => {
      const re = new RegExp(`\\b${word}\\b`, "i");
      const hits = entries.filter(({ text }) => re.test(text));
      expect(hits).toEqual([]);
    });
  }
});
