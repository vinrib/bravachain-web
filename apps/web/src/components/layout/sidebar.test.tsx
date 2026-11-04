// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const handleLogout = vi.fn();
let isAdmin = false;
vi.mock("@/lib/hooks", () => ({
  useMe: () => ({
    data: { name: "ACME LTDA", email: "acme@empresa.com" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
  useIsAdmin: () => isAdmin,
  useLogout: () => ({ signingOut: false, handleLogout }),
}));

import { Sidebar } from "./sidebar";

function renderSidebar() {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <Sidebar />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  handleLogout.mockClear();
  isAdmin = false;
});

describe("Sidebar", () => {
  it("does not render a language or theme selector (moved to Configurações)", () => {
    renderSidebar();
    expect(screen.queryByLabelText(/alternar idioma/i)).toBeNull();
    expect(screen.queryByLabelText(/modo claro|modo escuro/i)).toBeNull();
  });

  it("keeps 'Sair' accessible in the footer, alongside 'Configurações', and triggers sign-out", () => {
    renderSidebar();
    expect(screen.getByText("Configurações")).toBeTruthy();
    const sairButton = screen.getByRole("button", { name: "Sair" });
    fireEvent.click(sairButton);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("shows 'Área administrativa' in the footer only for admins", () => {
    isAdmin = true;
    renderSidebar();
    expect(screen.getByText("Área administrativa")).toBeTruthy();
  });
});
