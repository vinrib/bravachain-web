// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

vi.mock("@/lib/hooks", () => ({
  useBalance: () => ({
    data: { available: 16.53, currency: "BRL" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
  useMe: () => ({
    data: { name: "Vinicius Ribeiro de Souza", email: "v@empresa.com" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
  useIsAdmin: () => false,
  useLogout: () => ({ signingOut: false, handleLogout: vi.fn() }),
}));

const flags = vi.hoisted(() => ({ deposito: false, recebimentos: false }));
vi.mock("@/lib/feature-flags", () => ({
  get featureFlags() {
    return flags;
  },
}));

import { WelcomeHeroMobile } from "./welcome-hero-mobile";

function renderHero() {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <WelcomeHeroMobile />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  flags.deposito = false;
  flags.recebimentos = false;
});
afterEach(cleanup);

describe("WelcomeHeroMobile (Web 14 — Início hero)", () => {
  it("shows the real user's name and balance, not mock data", () => {
    renderHero();
    expect(screen.getByText("Vinicius Ribeiro de Souza")).toBeTruthy();
    expect(screen.getByText(/R\$\s*16,53/)).toBeTruthy();
  });

  it("toggles the balance visibility with the eye button", () => {
    renderHero();
    expect(screen.getByText(/R\$\s*16,53/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ocultar saldo" }));
    expect(screen.queryByText(/R\$\s*16,53/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar saldo" }));
    expect(screen.getByText(/R\$\s*16,53/)).toBeTruthy();
  });

  it("shows no action row when both Depósito and Receber are flagged off", () => {
    renderHero();
    expect(screen.queryByRole("link", { name: /Depósito/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Receber/ })).toBeNull();
  });

  it("shows only Receber when NEXT_PUBLIC_FEATURE_RECEBIMENTOS is on", () => {
    flags.recebimentos = true;
    renderHero();
    const receber = screen.getByRole("link", { name: /Receber/ });
    expect(receber.getAttribute("href")).toBe("/instrucoes-de-recebimento");
    expect(screen.queryByRole("link", { name: /Depósito/ })).toBeNull();
  });

  it("shows Depósito and Receber together when both flags are on", () => {
    flags.deposito = true;
    flags.recebimentos = true;
    renderHero();
    expect(screen.getByRole("link", { name: /Depósito/ }).getAttribute("href")).toBe("/deposito");
    expect(screen.getByRole("link", { name: /Receber/ }).getAttribute("href")).toBe(
      "/instrucoes-de-recebimento",
    );
  });

  it("never shows 'Sacar via PIX' or 'Ver extrato' in the mobile hero (they live in the bottom nav)", () => {
    flags.deposito = true;
    flags.recebimentos = true;
    renderHero();
    expect(screen.queryByText(/Sacar via PIX/)).toBeNull();
    expect(screen.queryByText(/Ver extrato/)).toBeNull();
  });

  it("opens the account menu sheet when the avatar is tapped", () => {
    renderHero();
    expect(screen.queryByRole("link", { name: "Configurações" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Vinicius Ribeiro de Souza/ }));
    expect(screen.getByRole("link", { name: "Configurações" })).toBeTruthy();
  });
});
