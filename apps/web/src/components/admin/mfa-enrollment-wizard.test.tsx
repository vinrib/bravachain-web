// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("@/lib/mfa/api", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/mfa/api")>();
  return {
    ...actual,
    mfaEnrollStart: vi.fn(),
    mfaEnrollConfirm: vi.fn(),
  };
});

import { mfaEnrollStart, mfaEnrollConfirm } from "@/lib/mfa/api";
import { MfaEnrollmentWizard } from "./mfa-enrollment-wizard";

function renderWizard(props: { required?: boolean } = {}) {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <MfaEnrollmentWizard {...props} />
    </NextIntlClientProvider>,
  );
}

const START = {
  otpauthUri: "otpauth://totp/Bravachain",
  qrDataUrl: "data:image/png;base64,QQ==",
  secret: "ABCDEFGH",
};

beforeEach(() => {
  replace.mockClear();
  refresh.mockClear();
  vi.mocked(mfaEnrollStart).mockReset();
  vi.mocked(mfaEnrollConfirm).mockReset();
});
afterEach(cleanup);

describe("MfaEnrollmentWizard", () => {
  it("walks install → confirm → recovery codes → finish", async () => {
    vi.mocked(mfaEnrollStart).mockResolvedValue(START);
    vi.mocked(mfaEnrollConfirm).mockResolvedValue({
      recoveryCodes: ["AAAA-1111", "BBBB-2222"],
    });
    renderWizard();

    // Step 1: QR + manual key, grouped for readability.
    expect(await screen.findByText("ABCD EFGH")).toBeTruthy();
    expect(screen.getByAltText("QR Code para o aplicativo autenticador")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    // Step 2: enter the first code.
    const code = screen.getByLabelText("Código do aplicativo");
    fireEvent.change(code, { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(mfaEnrollConfirm).toHaveBeenCalledWith("654321"));

    // Step 3: codes shown; finish is gated on the acknowledgement checkbox.
    expect(await screen.findByText("AAAA-1111")).toBeTruthy();
    const finish = screen.getByRole("button", { name: "Concluir" });
    expect((finish as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(
      screen.getByLabelText("Guardei meus códigos em local seguro"),
    );
    expect((finish as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(finish);
    expect(replace).toHaveBeenCalledWith("/admin");
  });

  it("shows an error when the first code is rejected", async () => {
    vi.mocked(mfaEnrollStart).mockResolvedValue(START);
    vi.mocked(mfaEnrollConfirm).mockRejectedValue(new Error("nope"));
    renderWizard();
    await screen.findByText("ABCD EFGH");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Código do aplicativo"), {
      target: { value: "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(
      await screen.findByText(
        "Código inválido. Confira o código no aplicativo e tente novamente.",
      ),
    ).toBeTruthy();
  });

  it("shows the enforcement banner when required", async () => {
    vi.mocked(mfaEnrollStart).mockResolvedValue(START);
    renderWizard({ required: true });
    expect(
      await screen.findByText(
        "Para acessar a área administrativa, ative a verificação em duas etapas.",
      ),
    ).toBeTruthy();
  });

  it("never writes the secret or recovery codes to web storage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(mfaEnrollStart).mockResolvedValue(START);
    vi.mocked(mfaEnrollConfirm).mockResolvedValue({ recoveryCodes: ["AAAA-1111"] });
    renderWizard();
    await screen.findByText("ABCD EFGH");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText("Código do aplicativo"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await screen.findByText("AAAA-1111");
    const leaked = setItem.mock.calls.some((args) =>
      args.some(
        (a) =>
          typeof a === "string" &&
          (a.includes("ABCDEFGH") || a.includes("AAAA-1111")),
      ),
    );
    expect(leaked).toBe(false);
    setItem.mockRestore();
  });
});
