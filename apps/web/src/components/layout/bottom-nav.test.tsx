// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import enMessages from "@/locales/en.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/saque",
}));

import { BottomNav } from "./bottom-nav";

function renderNav(messages: object = ptMessages) {
  return render(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <BottomNav />
    </NextIntlClientProvider>,
  );
}

afterEach(cleanup);

describe("BottomNav (Web 14 — 4-slot config-driven bar)", () => {
  it("shows exactly Início, Saque PIX and Extrato — no 'Enviar' slot (flag doesn't exist on this branch)", () => {
    renderNav();
    const links = screen.getAllByRole("link").map((el) => el.textContent?.trim());
    expect(links).toEqual(["Início", "Saque PIX", "Extrato"]);
  });

  it("has no 'Mais' overflow button and no central '+' button", () => {
    renderNav();
    expect(screen.queryByRole("button", { name: "Mais" })).toBeNull();
    expect(screen.queryByRole("link", { name: /\+/ })).toBeNull();
  });

  it("marks the current route with aria-current, and no other", () => {
    renderNav();
    const active = screen.getByRole("link", { name: "Saque PIX" });
    expect(active.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Início" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: "Extrato" }).getAttribute("aria-current")).toBeNull();
  });

  it("links to the real routes", () => {
    renderNav();
    expect(screen.getByRole("link", { name: "Início" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Saque PIX" }).getAttribute("href")).toBe("/saque");
    expect(screen.getByRole("link", { name: "Extrato" }).getAttribute("href")).toBe("/extrato");
  });

  it("translates labels via the home.nav locale namespace (en)", () => {
    renderNav(enMessages);
    const links = screen.getAllByRole("link").map((el) => el.textContent?.trim());
    expect(links).toEqual(["Home", "PIX withdrawal", "Statement"]);
  });

  it("respects the safe-area bottom inset", () => {
    renderNav();
    expect(screen.getByRole("navigation").className).toContain("env(safe-area-inset-bottom)");
  });
});
