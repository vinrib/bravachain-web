// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

const getStatement = vi.fn();
vi.mock("@/lib/statement/api", () => ({ getStatement: (...args: unknown[]) => getStatement(...args) }));

import { RecentPayments } from "./recent-payments";

afterEach(() => {
  cleanup();
  getStatement.mockReset();
});

describe("RecentPayments (Web 14 — mobile title/action differ from desktop, same data)", () => {
  it("shows a mobile heading 'Transações recentes' with a pill 'Ver todas' to /extrato", async () => {
    getStatement.mockResolvedValue({ transactions: [] });
    render(<RecentPayments />);
    expect(await screen.findByText("Transações recentes")).toBeTruthy();
    const pill = screen.getAllByRole("link", { name: "Ver todas" })[0]!;
    expect(pill.getAttribute("href")).toBe("/extrato");
  });

  it("keeps the desktop heading 'Pagamentos recentes' with 'Ver extrato' unchanged", async () => {
    getStatement.mockResolvedValue({ transactions: [] });
    render(<RecentPayments />);
    expect(await screen.findByText("Pagamentos recentes")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver extrato" }).getAttribute("href")).toBe("/extrato");
  });

  it("still renders real rows once, shared by both headings", async () => {
    getStatement.mockResolvedValue({
      transactions: [
        {
          id: "tx1",
          type: "WITHDRAWAL",
          status: "PROCESSING",
          amountBrl: 100,
          createdAt: new Date().toISOString(),
          counterparty: "chave@pix.com",
          description: null,
          amountForeign: null,
          foreignCurrency: null,
        },
      ],
    });
    render(<RecentPayments />);
    expect(await screen.findAllByText("Saque PIX")).toHaveLength(1);
  });

  // Overflow-safety invariants (the v2 defect: value/badge pushed past the
  // viewport). The money value must not wrap and its column must not shrink;
  // the title column must be allowed to shrink and truncate instead.
  it("keeps the amount on one line (whitespace-nowrap) in a shrink-0 column, and lets the title truncate", async () => {
    getStatement.mockResolvedValue({
      transactions: [
        {
          id: "tx1",
          type: "INBOUND",
          status: "COMPLETED",
          amountBrl: 1234567.89,
          createdAt: new Date().toISOString(),
          counterparty: "Um Nome De Contraparte Muito Muito Longo Que Deveria Truncar LLC",
          description: null,
          amountForeign: 250000,
          foreignCurrency: "USD",
        },
      ],
    });
    render(<RecentPayments />);
    const amount = (await screen.findAllByText(/R\$\s*1\.234\.567,89/))[0]!;
    expect(amount.className).toContain("whitespace-nowrap");
    // The amount lives in a shrink-0 column so it is never compressed/wrapped.
    expect(amount.closest(".shrink-0")).toBeTruthy();
    // The title can shrink + truncate so the row never exceeds the viewport.
    const title = screen.getAllByText(/Um Nome De Contraparte/)[0]!;
    expect(title.className).toContain("truncate");
    expect(title.closest(".min-w-0")).toBeTruthy();
  });
});
