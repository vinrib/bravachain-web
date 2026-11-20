// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

vi.mock("@/lib/hooks", () => ({
  useBalance: () => ({
    data: { available: 43804.25, currency: "BRL" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
  useMe: () => ({
    data: { name: "Marcia Alves", email: "marcia@empresa.com" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
  useIsAdmin: () => false,
  useLogout: () => ({ signingOut: false, handleLogout: vi.fn() }),
}));

const flags = vi.hoisted(() => ({ deposito: false, enviar: false }));
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
  flags.enviar = false;
});
afterEach(cleanup);

describe("WelcomeHeroMobile (Web 14 v3 — Marcia Alves header)", () => {
  it("shows the real name and balance (not mock data)", () => {
    renderHero();
    expect(screen.getByText("Marcia Alves")).toBeTruthy();
    expect(screen.getByText(/R\$\s*43\.804,25/)).toBeTruthy();
  });

  it("toggles the balance with the eye button", () => {
    renderHero();
    expect(screen.getByText(/R\$\s*43\.804,25/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ocultar saldo" }));
    expect(screen.queryByText(/R\$\s*43\.804,25/)).toBeNull();
  });

  it("always renders the three header actions Depósito / Transferir / Receber, in order", () => {
    renderHero();
    for (const label of ["Depósito", "Transferir", "Receber"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("Receber is always an enabled link to Instruções de recebimento", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /Receber/ }).getAttribute("href")).toBe(
      "/instrucoes-de-recebimento",
    );
  });

  it("Depósito and Transferir are disabled (aria-disabled, not links) when their flags are off", () => {
    renderHero();
    expect(screen.queryByRole("link", { name: /Depósito/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Transferir/ })).toBeNull();
    // Still present, visually, as aria-disabled controls.
    const deposito = screen.getByText("Depósito").closest("[aria-disabled]");
    const transferir = screen.getByText("Transferir").closest("[aria-disabled]");
    expect(deposito?.getAttribute("aria-disabled")).toBe("true");
    expect(transferir?.getAttribute("aria-disabled")).toBe("true");
  });

  it("Depósito becomes an enabled link to /deposito when its flag is on", () => {
    flags.deposito = true;
    renderHero();
    expect(screen.getByRole("link", { name: /Depósito/ }).getAttribute("href")).toBe("/deposito");
  });

  it("Transferir becomes an enabled link to /enviar when NEXT_PUBLIC_FEATURE_ENVIAR is on", () => {
    flags.enviar = true;
    renderHero();
    expect(screen.getByRole("link", { name: /Transferir/ }).getAttribute("href")).toBe("/enviar");
  });

  it("renders a decorative bell (aria-hidden, no button, no notification dot)", () => {
    const { container } = renderHero();
    // No interactive bell / notifications control.
    expect(screen.queryByRole("button", { name: /notifica/i })).toBeNull();
    // The bell icon exists but is aria-hidden (decorative).
    const bell = container.querySelector(".lucide-bell");
    expect(bell).toBeTruthy();
    expect(bell?.closest("[aria-hidden='true']")).toBeTruthy();
  });

  it("opens the account menu when the avatar is tapped (keeps mobile admin/settings/logout access)", () => {
    renderHero();
    expect(screen.queryByRole("link", { name: "Configurações" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Marcia Alves/ }));
    expect(screen.getByRole("link", { name: "Configurações" })).toBeTruthy();
  });

  it("does not show 'Sacar via PIX' or 'Ver extrato' in the mobile hero", () => {
    renderHero();
    expect(screen.queryByText(/Sacar via PIX/)).toBeNull();
    expect(screen.queryByText(/Ver extrato/)).toBeNull();
  });
});
