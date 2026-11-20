// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import enMessages from "@/locales/en.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/saque",
}));

const flags = vi.hoisted(() => ({ enviar: false }));
vi.mock("@/lib/feature-flags", () => ({
  get featureFlags() {
    return flags;
  },
}));

import { BottomNav } from "./bottom-nav";

function renderNav(messages: object = ptMessages) {
  return render(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <BottomNav />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  flags.enviar = false;
});
afterEach(cleanup);

describe("BottomNav (Web 14 v3 — 5 positions with central +)", () => {
  it("shows the four link slots Início/Pagamentos/Extrato/Empresa, in order", () => {
    renderNav();
    const links = screen.getAllByRole("link").map((el) => el.textContent?.trim());
    expect(links).toEqual(["Início", "Pagamentos", "Extrato", "Empresa"]);
  });

  it("links to the real routes (Pagamentos→/saque, Empresa→/configuracoes)", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Início" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Pagamentos" }).getAttribute("href")).toBe("/saque");
    expect(screen.getByRole("link", { name: "Extrato" }).getAttribute("href")).toBe("/extrato");
    expect(screen.getByRole("link", { name: "Empresa" }).getAttribute("href")).toBe("/configuracoes");
  });

  it("has a central '+' button (not a link) that opens the quick-actions sheet", () => {
    renderNav();
    const plus = screen.getByRole("button", { name: "Abrir ações" });
    expect(plus).toBeTruthy();
    // Sheet closed initially.
    expect(screen.queryByText("Ações rápidas")).toBeNull();
    fireEvent.click(plus);
    expect(screen.getByText("Ações rápidas")).toBeTruthy();
  });

  it("the quick-actions sheet offers Receber and Saque PIX, and hides Enviar when its flag is off", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Abrir ações" }));
    expect(screen.getByRole("link", { name: "Receber" }).getAttribute("href")).toBe(
      "/instrucoes-de-recebimento",
    );
    expect(screen.getByRole("link", { name: "Saque PIX" }).getAttribute("href")).toBe("/saque");
    expect(screen.queryByRole("link", { name: "Enviar" })).toBeNull();
  });

  it("shows Enviar in the sheet only when NEXT_PUBLIC_FEATURE_ENVIAR is on", () => {
    flags.enviar = true;
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Abrir ações" }));
    expect(screen.getByRole("link", { name: "Enviar" }).getAttribute("href")).toBe("/enviar");
  });

  it("marks the current route with aria-current (Pagamentos → /saque is active here)", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Pagamentos" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Início" }).getAttribute("aria-current")).toBeNull();
  });

  it("translates the labels via home.nav (en)", () => {
    renderNav(enMessages);
    const links = screen.getAllByRole("link").map((el) => el.textContent?.trim());
    expect(links).toEqual(["Home", "Payments", "Statement", "Company"]);
  });

  it("respects the safe-area bottom inset", () => {
    renderNav();
    expect(screen.getByRole("navigation").className).toContain("env(safe-area-inset-bottom)");
  });
});
