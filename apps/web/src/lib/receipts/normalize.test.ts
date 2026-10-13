import { describe, it, expect } from "vitest";
import { normalizeReceipts } from "./normalize";

describe("normalizeReceipts", () => {
  it("maps the `receipts` list and summary, coercing Decimal strings", () => {
    const out = normalizeReceipts({
      summary: { totalWithdrawn30d: "1500.75", withdrawalCount30d: 3 },
      receipts: [
        {
          id: "w1",
          protocol: "PROTO-1",
          amountBrl: "500.25",
          pixKey: "a@b.com",
          bankName: "Banco X",
          pixSentAt: "2026-10-01T10:00:00Z",
          createdAt: "2026-10-01T09:00:00Z",
        },
      ],
      pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
    });
    expect(out.summary.totalWithdrawn30d).toBe(1500.75);
    expect(out.summary.withdrawalCount30d).toBe(3);
    expect(out.receipts).toHaveLength(1);
    expect(out.receipts[0]!.amountBrl).toBe(500.25);
    expect(out.receipts[0]!.bankName).toBe("Banco X");
  });

  it("tolerates null bankName and missing fields", () => {
    const out = normalizeReceipts({
      receipts: [{ id: "w2", protocol: "P2", amountBrl: 10, pixKey: "x", bankName: null }],
    });
    expect(out.receipts[0]!.bankName).toBeNull();
    expect(out.receipts[0]!.pixSentAt).toBe("");
    expect(out.pagination.page).toBe(1);
  });

  it("is safe on empty/garbage input", () => {
    expect(normalizeReceipts(null).receipts).toEqual([]);
    expect(normalizeReceipts({ receipts: "nope" }).receipts).toEqual([]);
  });
});
