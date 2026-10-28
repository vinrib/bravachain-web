// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";

// --- Mocks -----------------------------------------------------------------
const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => ({ get: () => null }),
}));

// Keep the real `isMfaRequired`/`ApiError`; only stub the network `login`.
vi.mock("@/lib/client-api", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/client-api")>();
  return { ...actual, login: vi.fn() };
});

// Keep the real `MfaVerifyFailure` class; only stub `mfaVerify`.
vi.mock("@/lib/mfa/api", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/mfa/api")>();
  return { ...actual, mfaVerify: vi.fn() };
});

import { login } from "@/lib/client-api";
import { mfaVerify, MfaVerifyFailure } from "@/lib/mfa/api";
import { LoginForm } from "./login-form";

function renderForm() {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <LoginForm />
    </NextIntlClientProvider>,
  );
}

async function submitCredentials() {
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "admin@empresa.com.br" },
  });
  fireEvent.change(screen.getByLabelText("Senha"), {
    target: { value: "s3nh4-valida" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

async function reachCodeStep() {
  vi.mocked(login).mockResolvedValue({ mfaRequired: true, mfaToken: "tok-123" });
  await submitCredentials();
  await screen.findByText("Verificação em duas etapas");
}

async function enterCodeAndVerify(code = "123456") {
  const input = screen.getByLabelText("Código de verificação");
  fireEvent.change(input, { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
}

beforeEach(() => {
  replace.mockClear();
  refresh.mockClear();
  vi.mocked(login).mockReset();
  vi.mocked(mfaVerify).mockReset();
});
afterEach(cleanup);

describe("LoginForm — two-step login", () => {
  it("common login (no MFA) signs in and navigates, unchanged", async () => {
    vi.mocked(login).mockResolvedValue({ ok: true, user: { name: "ACME" } });
    renderForm();
    await submitCredentials();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    // The MFA step never appears.
    expect(screen.queryByText("Verificação em duas etapas")).toBeNull();
    expect(mfaVerify).not.toHaveBeenCalled();
  });

  it("shows the code step when the backend requires MFA (no navigation yet)", async () => {
    renderForm();
    await reachCodeStep();
    expect(screen.getByLabelText("Código de verificação")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it("verifies the code and then navigates", async () => {
    vi.mocked(mfaVerify).mockResolvedValue({ ok: true });
    renderForm();
    await reachCodeStep();
    await enterCodeAndVerify();
    await waitFor(() =>
      expect(mfaVerify).toHaveBeenCalledWith({ mfaToken: "tok-123", code: "123456" }),
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("shows a neutral error on an invalid code", async () => {
    vi.mocked(mfaVerify).mockRejectedValue(new MfaVerifyFailure({ kind: "invalid" }));
    renderForm();
    await reachCodeStep();
    await enterCodeAndVerify();
    expect(
      await screen.findByText("Código inválido. Verifique e tente novamente."),
    ).toBeTruthy();
  });

  it("shows the wait time when the account is locked", async () => {
    vi.mocked(mfaVerify).mockRejectedValue(
      new MfaVerifyFailure({ kind: "locked", retryAfterSeconds: 300 }),
    );
    renderForm();
    await reachCodeStep();
    await enterCodeAndVerify();
    expect(await screen.findByText(/5 min/)).toBeTruthy();
  });

  it("switches to a recovery code when asked", async () => {
    renderForm();
    await reachCodeStep();
    fireEvent.click(screen.getByRole("button", { name: "Usar um código de recuperação" }));
    expect(screen.getByLabelText("Código de recuperação")).toBeTruthy();
  });

  it("sends the recovery code via the recoveryCode field", async () => {
    vi.mocked(mfaVerify).mockResolvedValue({ ok: true });
    renderForm();
    await reachCodeStep();
    fireEvent.click(screen.getByRole("button", { name: "Usar um código de recuperação" }));
    fireEvent.change(screen.getByLabelText("Código de recuperação"), {
      target: { value: "recovery-code-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await waitFor(() =>
      expect(mfaVerify).toHaveBeenCalledWith({
        mfaToken: "tok-123",
        recoveryCode: "recovery-code-1",
      }),
    );
  });

  it("returns to step 1 with a message when the challenge expired", async () => {
    vi.mocked(mfaVerify).mockRejectedValue(new MfaVerifyFailure({ kind: "expired" }));
    renderForm();
    await reachCodeStep();
    await enterCodeAndVerify();
    // Back to the credentials step…
    expect(await screen.findByText("Entrar na sua conta")).toBeTruthy();
    // …with the expired notice.
    expect(screen.getByText("Sua verificação expirou. Entre novamente.")).toBeTruthy();
  });

  it("never writes the mfaToken (or anything) to web storage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(mfaVerify).mockResolvedValue({ ok: true });
    renderForm();
    await reachCodeStep();
    await enterCodeAndVerify();
    await waitFor(() => expect(replace).toHaveBeenCalled());
    const wroteToken = setItem.mock.calls.some((args) =>
      args.some((a) => typeof a === "string" && a.includes("tok-123")),
    );
    expect(wroteToken).toBe(false);
    setItem.mockRestore();
  });
});
