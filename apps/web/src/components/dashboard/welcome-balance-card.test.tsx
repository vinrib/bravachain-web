// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("@/lib/feature-flags", () => ({ featureFlags: { recebimentos: true } }));

vi.mock("@/lib/hooks", () => ({
  useBalance: () => ({
    data: { available: 1000, currency: "BRL" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
  useMe: () => ({
    data: { name: "ACME LTDA", email: "acme@empresa.com" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

import { WelcomeBalanceCard } from "./welcome-balance-card";

afterEach(cleanup);

describe("WelcomeBalanceCard", () => {
  it("shows 'Receber' between 'Sacar via PIX' and 'Ver extrato', linking to Instruções de recebimento", () => {
    render(<WelcomeBalanceCard />);
    const links = screen.getAllByRole("link").map((el) => el.textContent?.trim());
    expect(links).toEqual(["Sacar via PIX", "Receber", "Ver extrato"]);

    const receber = screen.getByRole("link", { name: "Receber" });
    expect(receber.getAttribute("href")).toBe("/instrucoes-de-recebimento");
  });
});
