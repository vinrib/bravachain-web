// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";

vi.mock("@/lib/hooks", () => ({
  useBalance: () => ({
    data: { available: 16.53, currency: "BRL" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock("@/lib/feature-flags", () => ({ featureFlags: { dadosConta: false, recebimentos: false } }));

const getAccounts = vi.fn();
vi.mock("@/lib/receive/api", () => ({ getAccounts: () => getAccounts() }));

import { MyAccounts } from "./my-accounts";

afterEach(() => {
  cleanup();
  getAccounts.mockReset();
});

describe("MyAccounts (Web 14 v3 — mobile USD/EUR only, desktop grid unchanged)", () => {
  it("mobile carousel shows USD/EUR cards and NO big BRL card", async () => {
    getAccounts.mockResolvedValue({
      accounts: [
        { currency: "USD", accountNumber: "3123456789" },
        { currency: "EUR", iban: "DE89370400440532013000" },
      ],
      pendingCurrencies: [],
    });
    render(<MyAccounts />);
    const mobile = within(await screen.findByTestId("accounts-mobile"));
    expect(await mobile.findByText("USD")).toBeTruthy();
    expect(mobile.getByText("EUR")).toBeTruthy();
    expect(mobile.queryByText("BRL")).toBeNull();
  });

  it("desktop grid KEEPS the BRL card plus USD/EUR (unchanged)", async () => {
    getAccounts.mockResolvedValue({
      accounts: [{ currency: "USD", accountNumber: "3123456789" }],
      pendingCurrencies: [],
    });
    render(<MyAccounts />);
    const desktop = within(await screen.findByTestId("accounts-desktop"));
    expect(await desktop.findByText("BRL")).toBeTruthy();
    expect(desktop.getByText("USD")).toBeTruthy();
  });

  it("mobile shows an empty-state card (no invented number, no BRL) when the API returns no foreign account", async () => {
    getAccounts.mockResolvedValue({ accounts: [], pendingCurrencies: [] });
    render(<MyAccounts />);
    const mobile = within(await screen.findByTestId("accounts-mobile"));
    expect(mobile.queryByText("USD")).toBeNull();
    expect(mobile.queryByText("EUR")).toBeNull();
    expect(mobile.queryByText("BRL")).toBeNull();
    // An empty-state card is present, with no masked/fake number.
    expect(mobile.getByText("Contas internacionais")).toBeTruthy();
    expect(mobile.queryByText(/••••/)).toBeNull();
  });

  it("masks the IBAN in the mobile card — never the full number", async () => {
    getAccounts.mockResolvedValue({
      accounts: [{ currency: "EUR", iban: "DE89370400440532013000" }],
      pendingCurrencies: [],
    });
    render(<MyAccounts />);
    const mobile = within(await screen.findByTestId("accounts-mobile"));
    const masked = await mobile.findByText(/••••/);
    expect(masked.textContent).not.toContain("DE89370400440532013000");
    expect(masked.textContent).toMatch(/3000$/);
  });

  it("shows a 'Ver todas' link to /dados-de-conta on mobile", async () => {
    getAccounts.mockResolvedValue({ accounts: [], pendingCurrencies: [] });
    render(<MyAccounts />);
    const verTodas = await screen.findByRole("link", { name: "Ver todas" });
    expect(verTodas.getAttribute("href")).toBe("/dados-de-conta");
  });
});
