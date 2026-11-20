// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

let isAdmin = false;
const handleLogout = vi.fn();
vi.mock("@/lib/hooks", () => ({
  useIsAdmin: () => isAdmin,
  useLogout: () => ({ signingOut: false, handleLogout }),
}));

import { AccountMenuSheet } from "./account-menu-sheet";

function renderSheet(onClose = vi.fn()) {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <AccountMenuSheet open onClose={onClose} />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  isAdmin = false;
  handleLogout.mockClear();
});

describe("AccountMenuSheet (avatar menu — replaces the old 'Mais' sheet)", () => {
  it("offers Configurações and Sair, and signs out", () => {
    renderSheet();
    expect(screen.getByRole("link", { name: "Configurações" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("hides 'Área administrativa' for a non-admin user", () => {
    isAdmin = false;
    renderSheet();
    expect(screen.queryByRole("link", { name: "Área administrativa" })).toBeNull();
  });

  it("shows 'Área administrativa' only for an admin user", () => {
    isAdmin = true;
    renderSheet();
    expect(screen.getByRole("link", { name: "Área administrativa" }).getAttribute("href")).toBe(
      "/admin",
    );
  });

  it("closes on Escape and on clicking the backdrop", () => {
    const onClose = vi.fn();
    renderSheet(onClose);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    // Two "Fechar" controls exist (backdrop + X button); click the backdrop.
    fireEvent.click(screen.getAllByLabelText("Fechar")[0]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when closed", () => {
    render(
      <NextIntlClientProvider locale="pt" messages={ptMessages}>
        <AccountMenuSheet open={false} onClose={vi.fn()} />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole("link", { name: "Configurações" })).toBeNull();
  });
});
