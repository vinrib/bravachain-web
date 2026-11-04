import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";
import { describe, it, expect } from "vitest";
import pt from "./pt.json";
import en from "./en.json";

/**
 * The Bravachain web app never approves/reviews on the user's behalf (only
 * Avenia decides) and never offers currency exchange (its margin is the
 * "Comissão Bravachain", not a spread/câmbio). Guards against either leaking
 * back into any locale string or any visible component/app copy.
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

function hasForbiddenTerm(text: string, term: string): boolean {
  // "spread" is only forbidden as a standalone word, since internal API
  // fields (e.g. lib/statement/types.ts) legitimately use it as an identifier.
  if (term === "spread") return /\bspread\b/i.test(text);
  return text.toLowerCase().includes(term.toLowerCase());
}

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
])("locale %s has no forbidden copy", (_name, messages) => {
  const strings: Array<{ path: string; text: string }> = [];
  collectLeafStrings(messages, "", strings);

  it("contains translatable strings to check", () => {
    expect(strings.length).toBeGreaterThan(0);
  });

  for (const term of FORBIDDEN) {
    it(`never contains "${term}"`, () => {
      const hits = strings.filter(({ text }) => hasForbiddenTerm(text, term));
      expect(hits.map((h) => h.path)).toEqual([]);
    });
  }
});

// --- Visible UI text (components + app) ------------------------------------
//
// Scans .tsx files under src/components and src/app for string literals and
// JSX text, skipping imports, type positions, and object/interface property
// names/keys, so internal field names (e.g. the `spread` field in
// lib/statement/types.ts) and code comments can never trigger a false
// positive — only text that would actually render to a user is checked.

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTsxFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

function collectVisibleStrings(sourceFile: ts.SourceFile): Array<{ text: string; line: number }> {
  const results: Array<{ text: string; line: number }> = [];

  function record(node: ts.Node, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
    results.push({ text: trimmed, line });
  }

  function visit(node: ts.Node): void {
    if (
      ts.isImportDeclaration(node) ||
      ts.isImportEqualsDeclaration(node) ||
      ts.isExportDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isTypeNode(node)
    ) {
      return;
    }

    if (ts.isJsxText(node)) {
      record(node, node.getText(sourceFile));
      return;
    }

    // Skip property/field *names* (identifiers or string-literal keys), but
    // still walk into their values.
    if (ts.isPropertyAssignment(node)) {
      visit(node.initializer);
      return;
    }
    if (ts.isPropertyDeclaration(node)) {
      if (node.initializer) visit(node.initializer);
      return;
    }
    if (ts.isPropertySignature(node)) {
      return;
    }

    if (ts.isStringLiteralLike(node)) {
      record(node, node.text);
      return;
    }

    if (ts.isTemplateExpression(node)) {
      record(node.head, node.head.text);
      for (const span of node.templateSpans) {
        record(span.literal, span.literal.text);
        visit(span.expression);
      }
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}

const UI_ROOTS = [path.join(__dirname, "..", "components"), path.join(__dirname, "..", "app")];

const uiStrings = UI_ROOTS.flatMap((root) => listTsxFiles(root)).flatMap((file) => {
  const content = fs.readFileSync(file, "utf-8");
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return collectVisibleStrings(sourceFile).map(({ text, line }) => ({
    path: `${path.relative(path.join(__dirname, ".."), file)}:${line}`,
    text,
  }));
});

describe("component and app visible text has no forbidden copy", () => {
  it("contains visible strings to check", () => {
    expect(uiStrings.length).toBeGreaterThan(0);
  });

  for (const term of FORBIDDEN) {
    it(`never contains "${term}"`, () => {
      const hits = uiStrings.filter(({ text }) => hasForbiddenTerm(text, term));
      expect(hits.map((h) => h.path)).toEqual([]);
    });
  }
});
