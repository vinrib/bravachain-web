import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect } from "vitest";
import pt from "@/locales/pt.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";

/**
 * Board directive (2026-10-31): Bravachain/Wiress never approves, rejects,
 * limits, or "reviews" a client or operation — only Avenia decides. The
 * compliance-review queue (clients, owners, documents) was removed entirely
 * and must never come back under a flag, a hidden route, or a buttonless
 * page. Reintroducing anything like it requires a new ADR and regulatory
 * sign-off. This test fails the build if it ever starts to creep back in.
 *
 * Two independent checks, deliberately narrow (path/key-scoped) so a
 * legitimate future admin route never has to loosen this list:
 *  1. No page/route segment under app/admin whose name suggests a
 *     decision/review flow.
 *  2. No i18n key or value anywhere in pt/en/es matches one of the exact
 *     phrases this queue used to show.
 */

const ADMIN_APP_DIR = path.join(__dirname, "..", "..", "app", "admin");

// Route-segment names only (file/dir basenames, extension stripped) — matching
// on the full path would also flag unrelated things like a "reject" in a
// node_modules cache path during local dev.
const FORBIDDEN_ROUTE_SEGMENT = /review|revisao|approve|reject|aprovar|reprovar/i;

function listRouteSegments(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const base = entry.name.replace(/\.(tsx|ts)$/, "");
    out.push(base);
    if (entry.isDirectory()) {
      out.push(...listRouteSegments(path.join(dir, entry.name)));
    }
  }
  return out;
}

describe("no-review-queue lock-down — admin route tree", () => {
  it("has no page/route segment under app/admin naming a review or decision flow", () => {
    const segments = listRouteSegments(ADMIN_APP_DIR);
    const hits = segments.filter((s) => FORBIDDEN_ROUTE_SEGMENT.test(s));
    expect(hits).toEqual([]);
  });
});

const FORBIDDEN_PHRASES = [
  "clientes em revisão",
  "fila de revisão",
  "revisão de compliance",
  "aprovar cliente",
  "reprovar cliente",
];

function collect(value: unknown, keyPath: string, out: Array<{ keyPath: string; text: string }>) {
  if (typeof value === "string") {
    out.push({ keyPath, text: value });
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collect(child, keyPath ? `${keyPath}.${key}` : key, out);
    }
  }
}

describe.each([
  ["pt.json", pt],
  ["en.json", en],
  ["es.json", es],
])("no-review-queue lock-down — %s", (_name, messages) => {
  const entries: Array<{ keyPath: string; text: string }> = [];
  collect(messages, "", entries);

  for (const phrase of FORBIDDEN_PHRASES) {
    it(`no value matches "${phrase}"`, () => {
      const hits = entries.filter(({ text }) => text.toLowerCase().includes(phrase.toLowerCase()));
      expect(hits.map((h) => h.keyPath)).toEqual([]);
    });
  }

  it("has no 'clients' or 'review' key directly under the admin namespace", () => {
    const admin = (messages as { admin?: Record<string, unknown> }).admin ?? {};
    expect("clients" in admin).toBe(false);
    expect("review" in admin).toBe(false);
  });
});
