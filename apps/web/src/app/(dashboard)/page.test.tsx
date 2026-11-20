// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("@/lib/hooks", () => ({
  useKycState: () => ({
    data: { status: "approved" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

// Every dashboard child is unit-tested on its own (welcome-hero-mobile.test.tsx,
// my-accounts.test.tsx, recent-payments.test.tsx, ...) — this page-level test
// only checks *composition*: what renders where, and what's duplicated for the
// mobile-vs-desktop split described in the Web 14 spec.
vi.mock("@/components/dashboard/kyc-banner", () => ({
  KycBanner: () => <div data-testid="kyc-banner" />,
}));
vi.mock("@/components/dashboard/welcome-hero-mobile", () => ({
  WelcomeHeroMobile: () => <div data-testid="hero-mobile" />,
}));
vi.mock("@/components/dashboard/welcome-balance-card", () => ({
  WelcomeBalanceCard: () => <div data-testid="hero-desktop" />,
}));
vi.mock("@/components/dashboard/my-accounts", () => ({
  MyAccounts: () => <div data-testid="my-accounts" />,
}));
vi.mock("@/components/dashboard/recent-payments", () => ({
  RecentPayments: () => <div data-testid="recent-payments" />,
}));
vi.mock("@/components/dashboard/em-processamento", () => ({
  EmProcessamento: () => <div data-testid="em-processamento" />,
}));
vi.mock("@/components/dashboard/saque-rapido", () => ({
  SaqueRapido: () => <div data-testid="saque-rapido" />,
}));

import DashboardPage from "./page";

afterEach(cleanup);

describe("Início page composition (Web 14)", () => {
  it("renders the mobile hero bleed wrapper and the (hidden) desktop header/card", () => {
    const { container } = render(<DashboardPage />);
    expect(screen.getByTestId("hero-mobile")).toBeTruthy();
    expect(screen.getByTestId("hero-desktop")).toBeTruthy();
    expect(container.querySelector(".md\\:hidden")).toBeTruthy();
  });

  it("renders Em processamento twice — once inline (mobile order) and once in the aside (desktop)", () => {
    render(<DashboardPage />);
    expect(screen.getAllByTestId("em-processamento")).toHaveLength(2);
  });

  it("renders MyAccounts and RecentPayments once each (no mobile/desktop duplication needed there)", () => {
    render(<DashboardPage />);
    expect(screen.getAllByTestId("my-accounts")).toHaveLength(1);
    expect(screen.getAllByTestId("recent-payments")).toHaveLength(1);
  });

  it("orders the main column as Minhas contas, Em processamento (mobile), Transações recentes — the desktop-aside instance of Em processamento comes after, in source order", () => {
    const { container } = render(<DashboardPage />);
    const ids = Array.from(
      container.querySelectorAll('[data-testid="my-accounts"], [data-testid="em-processamento"], [data-testid="recent-payments"]'),
    ).map((el) => el.getAttribute("data-testid"));
    expect(ids).toEqual(["my-accounts", "em-processamento", "recent-payments", "em-processamento"]);
  });

  it("keeps Saque rápido only in the (desktop) aside", () => {
    render(<DashboardPage />);
    expect(screen.getAllByTestId("saque-rapido")).toHaveLength(1);
  });
});
