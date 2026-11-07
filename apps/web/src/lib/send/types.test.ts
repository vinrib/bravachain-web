import { describe, it, expect } from "vitest";
import { currencyFromSlug, CURRENCY_SLUG, SEND_CURRENCIES } from "./types";

describe("currency <-> slug", () => {
  it("maps each currency to a lowercase slug and back", () => {
    for (const c of SEND_CURRENCIES) {
      expect(CURRENCY_SLUG[c]).toBe(c.toLowerCase());
      expect(currencyFromSlug(CURRENCY_SLUG[c])).toBe(c);
    }
  });

  it("is case-insensitive on the slug", () => {
    expect(currencyFromSlug("USD")).toBe("USD");
    expect(currencyFromSlug("Eur")).toBe("EUR");
  });

  it("returns null for an unknown slug (route should 404)", () => {
    expect(currencyFromSlug("gbp")).toBeNull();
    expect(currencyFromSlug("")).toBeNull();
    expect(currencyFromSlug("usdd")).toBeNull();
  });
});
