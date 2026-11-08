import { describe, it, expect } from "vitest";
import { getPurposeCodes } from "./api";

describe("getPurposeCodes (mock)", () => {
  it("returns two-level categories with coded items", async () => {
    const cats = await getPurposeCodes();
    expect(cats.length).toBeGreaterThan(0);
    const first = cats[0]!;
    expect(first.name).toBeTruthy();
    expect(first.items.length).toBeGreaterThan(0);
    expect(first.items[0]!.code).toMatch(/^\d+$/);
    expect(first.items[0]!.category).toBe(first.name);
  });
});
