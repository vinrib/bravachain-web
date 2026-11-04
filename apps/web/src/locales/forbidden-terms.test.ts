import { describe, it, expect } from "vitest";
import pt from "./pt.json";
import en from "./en.json";
import es from "./es.json";

/**
 * The Bravachain web app never approves/reviews on the user's behalf (only
 * Avenia decides) and never offers currency exchange (its margin is the
 * "Comissão Bravachain", not a spread/câmbio). Guards against either leaking
 * back into any locale string.
 */
const FORBIDDEN = [
  "spread",
  "câmbio",
  "cambio",
  "taxa de conversão",
  "estamos analisando",
  "aprovamos",
  "reprovamos",
];

function collectLeafStrings(value: unknown, path: string, out: Array<{ path: string; text: string }>) {
  if (typeof value === "string") {
    out.push({ path, text: value });
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectLeafStrings(child, path ? `${path}.${key}` : key, out);
    }
  }
}

describe.each([
  ["pt.json", pt],
  ["en.json", en],
  ["es.json", es],
])("locale %s has no forbidden copy", (_name, messages) => {
  const strings: Array<{ path: string; text: string }> = [];
  collectLeafStrings(messages, "", strings);

  it("contains translatable strings to check", () => {
    expect(strings.length).toBeGreaterThan(0);
  });

  for (const term of FORBIDDEN) {
    it(`never contains "${term}"`, () => {
      const hits = strings.filter(({ text }) => text.toLowerCase().includes(term.toLowerCase()));
      expect(hits.map((h) => h.path)).toEqual([]);
    });
  }
});

function keyPaths(value: unknown, path: string, out: string[]) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      keyPaths(child, path ? `${path}.${key}` : key, out);
    }
  } else {
    out.push(path);
  }
}

describe("pt/en/es locales have the same keys", () => {
  const ptKeys = [] as string[];
  const enKeys = [] as string[];
  const esKeys = [] as string[];
  keyPaths(pt, "", ptKeys);
  keyPaths(en, "", enKeys);
  keyPaths(es, "", esKeys);

  it("en has no keys missing from pt, and vice versa", () => {
    const ptSet = new Set(ptKeys);
    const enSet = new Set(enKeys);
    expect(enKeys.filter((k) => !ptSet.has(k))).toEqual([]);
    expect(ptKeys.filter((k) => !enSet.has(k))).toEqual([]);
  });

  it("es has no keys missing from pt, and vice versa", () => {
    const ptSet = new Set(ptKeys);
    const esSet = new Set(esKeys);
    expect(esKeys.filter((k) => !ptSet.has(k))).toEqual([]);
    expect(ptKeys.filter((k) => !esSet.has(k))).toEqual([]);
  });
});
