// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/hooks", () => ({
  useBalance: () => ({
    data: { available: 1000, currency: "BRL" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
  useKycState: () => ({
    data: { status: "approved" },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock("@/lib/withdraw/use-preview", () => ({
  useWithdrawPreview: () => ({ data: null, loading: false, error: false }),
}));

const success = vi.fn();
const info = vi.fn();
const error = vi.fn();
vi.mock("@/components/toast-provider", () => ({
  useToast: () => ({ success, info, error }),
}));

vi.mock("@/lib/client-api", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/client-api")>();
  return { ...actual, apiFetch: vi.fn() };
});

import { apiFetch, ApiError } from "@/lib/client-api";
import SaquePage from "./page";

function renderPage() {
  return render(<SaquePage />);
}

function fillForm() {
  fireEvent.change(screen.getByPlaceholderText("0,00"), {
    target: { value: "100,00" },
  });
  fireEvent.change(screen.getByLabelText("Chave PIX de destino"), {
    target: { value: "destinatario@empresa.com" },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Solicitar saque" }));
}

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  success.mockClear();
  info.mockClear();
  error.mockClear();
  vi.mocked(apiFetch).mockReset();
});
afterEach(cleanup);

describe("Saque page — resultado do POST /v1/withdraw/pix (API PR #105)", () => {
  it("201 PROCESSING -> toast neutro de sucesso e navega para /extrato", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ withdrawalId: "w1", status: "PROCESSING" });
    renderPage();
    fillForm();
    submit();

    await waitFor(() => expect(success).toHaveBeenCalled());
    const [title, message] = success.mock.calls[0]!;
    expect(title).toBe("Saque solicitado");
    expect(message).toContain("Acompanhe o status da operação no extrato.");
    expect(info).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/extrato");
  });

  it("202 PENDING -> toast informativo sem 'erro'/'tente novamente', e ainda navega para /extrato", async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      withdrawalId: "w2",
      status: "PENDING",
      message: "aguardando confirmação do provedor",
    });
    renderPage();
    fillForm();
    submit();

    await waitFor(() => expect(info).toHaveBeenCalled());
    const [title, message] = info.mock.calls[0]!;
    expect(title).toBe("Saque em processamento");
    expect(message.toLowerCase()).not.toContain("erro");
    expect(message.toLowerCase()).not.toContain("tente novamente");
    expect(success).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/extrato");
  });

  it("sem 'status' no corpo (API anterior ao #105) -> cai no toast neutro de sucesso", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ withdrawalId: "w3" });
    renderPage();
    fillForm();
    submit();

    await waitFor(() => expect(success).toHaveBeenCalled());
    expect(success.mock.calls[0]![0]).toBe("Saque solicitado");
    expect(push).toHaveBeenCalledWith("/extrato");
  });

  it("503 WITHDRAW_PROVIDER_ERROR -> mostra erro e deixa o formulário pronto para nova tentativa", async () => {
    vi.mocked(apiFetch).mockRejectedValue(
      new ApiError(503, "upstream failure", "WITHDRAW_PROVIDER_ERROR"),
    );
    renderPage();
    fillForm();
    submit();

    expect(
      await screen.findByText(
        "Não foi possível processar o saque agora. Tente novamente em instantes.",
      ),
    ).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    // Single attempt per submit — but the button is not stuck disabled, so the
    // user can correct and resubmit (no automatic retry happens on its own).
    const button = screen.getByRole("button", {
      name: "Solicitar saque",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });
});
