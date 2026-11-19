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
});
