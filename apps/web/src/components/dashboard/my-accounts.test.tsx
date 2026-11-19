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

describe("MyAccounts (Web 14 — mobile carousel + unchanged desktop grid)", () => {
  // Cards render once per layout (mobile carousel + desktop grid, CSS-toggled
  // — see the dual-render test below), so these scope to the desktop grid as
  // the single source of truth for "which cards exist".
  it("shows only the real BRL card when the API returns no dedicated account", async () => {
    getAccounts.mockResolvedValue({ accounts: [], pendingCurrencies: [] });
    render(<MyAccounts />);
    const desktop = within(await screen.findByTestId("accounts-desktop"));
    expect(await desktop.findByText("BRL")).toBeTruthy();
    expect(desktop.queryByText("USD")).toBeNull();
    expect(desktop.queryByText("EUR")).toBeNull();
  });

  it("adds a USD/EUR card only when the API returns that dedicated account — never invented", async () => {
    getAccounts.mockResolvedValue({
      accounts: [{ currency: "EUR", iban: "DE89370400440532013000" }],
      pendingCurrencies: ["USD"],
    });
    render(<MyAccounts />);
    const desktop = within(screen.getByTestId("accounts-desktop"));
    expect(await desktop.findByText("EUR")).toBeTruthy();
    expect(desktop.queryByText("USD")).toBeNull();
  });

  it("masks the IBAN — never shows the full number", async () => {
    getAccounts.mockResolvedValue({
      accounts: [{ currency: "EUR", iban: "DE89370400440532013000" }],
      pendingCurrencies: [],
    });
    render(<MyAccounts />);
    const desktop = within(screen.getByTestId("accounts-desktop"));
    const masked = await desktop.findByText(/••••/);
    expect(masked.textContent).not.toContain("DE89370400440532013000");
    expect(masked.textContent).toMatch(/3000$/);
  });

  it("renders the same cards in both the mobile carousel and the desktop grid", async () => {
    getAccounts.mockResolvedValue({
      accounts: [{ currency: "USD", accountNumber: "0001234567" }],
      pendingCurrencies: [],
    });
    render(<MyAccounts />);
    await screen.findAllByText("USD");

    const mobile = screen.getByTestId("accounts-mobile");
    const desktop = screen.getByTestId("accounts-desktop");
    expect(within(mobile).getAllByText("BRL").length).toBe(1);
    expect(within(mobile).getAllByText("USD").length).toBe(1);
    expect(within(desktop).getAllByText("BRL").length).toBe(1);
    expect(within(desktop).getAllByText("USD").length).toBe(1);
  });
});
