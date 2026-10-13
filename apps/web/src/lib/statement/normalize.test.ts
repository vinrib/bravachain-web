import { describe, it, expect } from "vitest";
import { normalizeStatement } from "./normalize";

describe("normalizeStatement", () => {
  it("maps the `transactions` list and coerces Decimal strings to numbers", () => {
    const raw = {
      summary: {
        totalInbound: "1000.50",
        totalWithdrawn: "250",
        averageRate: 0,
        periodStart: "2026-09-01",
        periodEnd: "2026-10-01",
      },
      transactions: [
        {
          id: "t1",
          type: "INBOUND",
          rail: "USD_WIRE",
          description: "Pagamento ACME",
          amountBrl: "1000.50",
          amountForeign: "200.00",
          foreignCurrency: "USD",
          rateApplied: "5.00",
          spread: null,
          runningBalance: "1000.50",
          reference: null,
          counterparty: "ACME INC",
          status: "COMPLETED",
          createdAt: "2026-09-10T12:00:00Z",
          internalId: "int-1",
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    const out = normalizeStatement(raw);
    expect(out.summary.totalInbound).toBe(1000.5);
    expect(out.transactions).toHaveLength(1);
    const row = out.transactions[0]!;
    expect(row.type).toBe("INBOUND");
    expect(row.amountBrl).toBe(1000.5);
    expect(row.amountForeign).toBe(200);
    expect(row.rateApplied).toBe(5);
    expect(row.spread).toBeNull();
    expect(out.pagination.totalPages).toBe(1);
  });

  it("keeps nullable fields null and defaults missing ones", () => {
    const out = normalizeStatement({
      transactions: [{ id: "x", type: "WITHDRAWAL" }],
    });
    const row = out.transactions[0]!;
    expect(row.type).toBe("WITHDRAWAL");
    expect(row.amountBrl).toBe(0);
    expect(row.amountForeign).toBeNull();
    expect(row.foreignCurrency).toBeNull();
    expect(row.description).toBe("");
  });

  it("is safe on empty/garbage input", () => {
    expect(normalizeStatement(null).transactions).toEqual([]);
    expect(normalizeStatement({}).pagination.page).toBe(1);
    expect(normalizeStatement({ transactions: "nope" }).transactions).toEqual([]);
  });
});
