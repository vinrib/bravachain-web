// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import { ApiError } from "@/lib/client-api";
import type { AdminUser } from "@/lib/admin/types";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/admin/users", () => ({
  listAdmins: vi.fn(),
  searchUsers: vi.fn(),
  changeRole: vi.fn(),
  resetUserMfa: vi.fn(),
}));
vi.mock("@/lib/mfa/api", () => ({
  mfaRegenerateRecoveryCodes: vi.fn(),
  mfaStatus: vi.fn(),
}));

let identity = { userId: "admin-1", isAdmin: true, loading: false };
vi.mock("@/lib/hooks", () => ({ useAdminIdentity: () => identity }));

import { listAdmins, searchUsers, changeRole, resetUserMfa } from "@/lib/admin/users";
import { mfaRegenerateRecoveryCodes, mfaStatus } from "@/lib/mfa/api";
import { AdminsSecurity } from "./admins-security";

const ME: AdminUser = {
  userId: "admin-1",
  name: "Eu Mesmo",
  email: "eu@exemplo.com.br",
  role: "ADMIN",
  mfaEnabled: true,
  createdAt: null,
  lastLoginAt: "2026-10-20T10:00:00Z",
};
const OTHER: AdminUser = {
  userId: "admin-2",
  name: "Outro Diretor",
  email: "outro@exemplo.com.br",
  role: "ADMIN",
  mfaEnabled: false,
  createdAt: null,
  lastLoginAt: null,
};

function renderScreen() {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <AdminsSecurity />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  identity = { userId: "admin-1", isAdmin: true, loading: false };
  vi.mocked(listAdmins).mockReset();
  vi.mocked(searchUsers).mockReset();
  vi.mocked(changeRole).mockReset();
  vi.mocked(resetUserMfa).mockReset();
  vi.mocked(mfaRegenerateRecoveryCodes).mockReset();
  vi.mocked(mfaStatus).mockReset();
  // Default: my own MFA is active with a full set of recovery codes.
  vi.mocked(mfaStatus).mockResolvedValue({
    enabled: true,
    enabledAt: "2026-10-20T10:00:00Z",
    recoveryCodesRemaining: 8,
  });
});
afterEach(cleanup);

describe("AdminsSecurity", () => {
  it("disables reset/demote on your own row", async () => {
    vi.mocked(listAdmins).mockResolvedValue({ items: [ME, OTHER], page: 1, pageSize: 50, total: 2 });
    renderScreen();
    await screen.findAllByText("Eu Mesmo");
    // The self row carries the "Você" badge; its action buttons are disabled.
    const reset = screen.getAllByRole("button", { name: "Resetar MFA" });
    const demote = screen.getAllByRole("button", { name: "Rebaixar para usuário" });
    // Two rows → first (me) disabled, second (other) enabled.
    expect((reset[0] as HTMLButtonElement).disabled).toBe(true);
    expect((demote[0] as HTMLButtonElement).disabled).toBe(true);
    expect((reset[1] as HTMLButtonElement).disabled).toBe(false);
  });

  it("disables demote when there is only one admin", async () => {
    identity = { userId: "someone-else", isAdmin: true, loading: false };
    vi.mocked(listAdmins).mockResolvedValue({ items: [OTHER], page: 1, pageSize: 50, total: 1 });
    renderScreen();
    await screen.findAllByText("Outro Diretor");
    expect(
      (screen.getAllByRole("button", { name: "Rebaixar para usuário" })[0] as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("shows the role-management-disabled banner on a 404 from promote", async () => {
    vi.mocked(listAdmins).mockResolvedValue({ items: [ME], page: 1, pageSize: 50, total: 1 });
    vi.mocked(searchUsers).mockResolvedValue([
      { userId: "u9", name: "Marcos Exemplo", email: "marcos@exemplo.com.br", role: "USER" },
    ]);
    vi.mocked(changeRole).mockRejectedValue(new ApiError(404, "not found"));
    renderScreen();
    await screen.findAllByText("Eu Mesmo");

    fireEvent.click(screen.getByRole("button", { name: "Promover a administrador" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Buscar usuário por e-mail"), {
      target: { value: "marcos" },
    });
    const result = await within(dialog).findByText("Marcos Exemplo", {}, { timeout: 2000 });
    fireEvent.click(result);
    fireEvent.change(within(dialog).getByLabelText("Motivo"), {
      target: { value: "Novo diretor de compliance." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Promover a administrador" }));

    expect(await screen.findByText(/A gestão de papéis está desativada/i)).toBeTruthy();
  });

  it("resets another admin's MFA with a reason", async () => {
    vi.mocked(listAdmins).mockResolvedValue({ items: [ME, OTHER], page: 1, pageSize: 50, total: 2 });
    vi.mocked(resetUserMfa).mockResolvedValue(undefined);
    renderScreen();
    await screen.findAllByText("Outro Diretor");
    fireEvent.click(screen.getAllByRole("button", { name: "Resetar MFA" })[1]!);
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Motivo"), {
      target: { value: "Perdeu o dispositivo." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Resetar MFA" }));
    await waitFor(() =>
      expect(resetUserMfa).toHaveBeenCalledWith("admin-2", "Perdeu o dispositivo."),
    );
  });

  it("shows the MFA enrollment date and a low-recovery-codes warning", async () => {
    vi.mocked(listAdmins).mockResolvedValue({ items: [ME], page: 1, pageSize: 50, total: 1 });
    vi.mocked(mfaStatus).mockResolvedValue({
      enabled: true,
      enabledAt: "2026-10-20T10:00:00Z",
      recoveryCodesRemaining: 2,
    });
    renderScreen();
    expect(await screen.findByText(/ativado em 20\/10\/2026/i)).toBeTruthy();
    expect(await screen.findByText(/Restam 2 de 8 códigos de recuperação/i)).toBeTruthy();
  });

  it("offers activation when MFA is inactive", async () => {
    vi.mocked(listAdmins).mockResolvedValue({ items: [ME], page: 1, pageSize: 50, total: 1 });
    vi.mocked(mfaStatus).mockResolvedValue({
      enabled: false,
      enabledAt: null,
      recoveryCodesRemaining: null,
    });
    renderScreen();
    expect(await screen.findByRole("link", { name: "Ativar verificação" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Gerar novos códigos de recuperação" })).toBeNull();
  });

  it("regenerates my recovery codes and shows them once (never to storage)", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(listAdmins).mockResolvedValue({ items: [ME], page: 1, pageSize: 50, total: 1 });
    vi.mocked(mfaRegenerateRecoveryCodes).mockResolvedValue({
      recoveryCodes: ["AAAA-1111", "BBBB-2222"],
    });
    renderScreen();
    await screen.findAllByText("Eu Mesmo");
    fireEvent.click(screen.getByRole("button", { name: "Gerar novos códigos de recuperação" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Código atual do autenticador"), {
      target: { value: "654321" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Gerar" }));
    expect(await screen.findByText("AAAA-1111")).toBeTruthy();
    const leaked = setItem.mock.calls.some((args) =>
      args.some((a) => typeof a === "string" && a.includes("AAAA-1111")),
    );
    expect(leaked).toBe(false);
    setItem.mockRestore();
  });
});
