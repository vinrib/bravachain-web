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

describe("PTAX_COPY regulatory text policy compliance", () => {
  const entries: Array<{ path: string; text: string }> = [];
  collectLeafStrings(PTAX_COPY, "PTAX_COPY", entries);

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
