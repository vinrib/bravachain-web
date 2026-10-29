// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import { ApiError } from "@/lib/client-api";
import type { ClientDetail } from "@/lib/admin/types";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/admin/compliance", () => ({
  getClient: vi.fn(),
  saveReview: vi.fn(),
  decide: vi.fn(),
  setGrandfathered: vi.fn(),
  revealOwnerCpf: vi.fn(),
  removeOwner: vi.fn(),
  accessDocument: vi.fn(),
  addOwner: vi.fn(),
  updateOwner: vi.fn(),
}));

let identity = { userId: "admin-1", isAdmin: true, loading: false };
vi.mock("@/lib/hooks", () => ({ useAdminIdentity: () => identity }));

import {
  getClient,
  saveReview,
  setGrandfathered,
  revealOwnerCpf,
  removeOwner,
  accessDocument,
  addOwner,
  updateOwner,
} from "@/lib/admin/compliance";
import { ClientReview } from "./client-review";

// A structurally valid test CPF (generated, not real). Masked server-side as below.
const TEST_CPF = "52998224725";
const TEST_CPF_MASKED = "•••.982.•••-25";
const TEST_CPF_FORMATTED = "529.982.247-25";

function makeDetail(over: Partial<ClientDetail> = {}): ClientDetail {
  return {
    userId: "client-1",
    accountType: "COMPANY",
    kybStatus: "APPROVED",
    complianceGrandfathered: false,
    company: {
      name: "Exemplo Comércio Exterior Ltda",
      cnpj: "00000000000100",
      openingDate: "2018-03-12T00:00:00Z",
      cnae: "4669-9/99",
      estimatedRevenue: 1840000,
      mainBuyerCountry: "US",
      kybStatus: "APPROVED",
      kybSubmittedAt: "2026-09-01T00:00:00Z",
    },
    simulatedGateDecision: { allowed: false, reason: "COMPLIANCE_REVIEW_PENDING" },
    review: {
      status: "IN_REVIEW",
      riskLevel: "HIGH",
      riskRationale: "",
      isPep: false,
      pepNotes: "",
      sourceOfFundsNotes: "",
      projectedMonthlyVolumeBrl: null,
      publicFundsInvolved: null,
      reviewedAt: null,
      nextReviewAt: null,
    },
    approvals: [],
    owners: [
      {
        id: "o1",
        fullName: "Fulano de Tal",
        cpfMasked: TEST_CPF_MASKED,
        cpfRevealable: true,
        ownershipPercent: 50,
        role: "Sócio",
        isPep: false,
        pepRole: null,
        pepEndedAt: null,
        relatedToPep: false,
        notes: null,
      },
    ],
    documents: [
      {
        id: "d1",
        type: "CONTRATO_SOCIAL",
        fileName: "contrato.pdf",
        fileSizeKb: 120,
        uploadedAt: "2026-10-01T00:00:00Z",
      },
    ],
    ...over,
  };
}

function renderReview() {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <ClientReview userId="client-1" />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  identity = { userId: "admin-1", isAdmin: true, loading: false };
  vi.mocked(getClient).mockReset();
  vi.mocked(saveReview).mockReset();
  vi.mocked(setGrandfathered).mockReset();
  vi.mocked(revealOwnerCpf).mockReset();
  vi.mocked(removeOwner).mockReset();
  vi.mocked(accessDocument).mockReset();
  vi.mocked(addOwner).mockReset();
  vi.mocked(updateOwner).mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ClientReview — company", () => {
  it("renders company data from the detail (survives deep-link)", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    renderReview();
    expect(await screen.findAllByText("Exemplo Comércio Exterior Ltda")).toBeTruthy();
    expect(screen.getByText("4669-9/99")).toBeTruthy();
    expect(screen.getAllByText("00.000.000/0001-00").length).toBeGreaterThan(0);
  });

  it("shows the masked CPF and no full CPF in the initial HTML", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    const { container } = renderReview();
    expect(await screen.findByText(TEST_CPF_MASKED)).toBeTruthy();
    expect(container.innerHTML).not.toContain(TEST_CPF);
    expect(container.innerHTML).not.toContain(TEST_CPF_FORMATTED);
  });
});

describe("ClientReview — CPF reveal (audited)", () => {
  it("warns, then reveals via the route and re-masks after 30s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    vi.mocked(revealOwnerCpf).mockResolvedValue(TEST_CPF);
    renderReview();

    await screen.findByText(TEST_CPF_MASKED);
    fireEvent.click(screen.getByRole("button", { name: "Revelar" }));
    // The audit warning shows before the call happens.
    expect(screen.getByText("Esta consulta será registrada na auditoria.")).toBeTruthy();
    expect(revealOwnerCpf).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Revelar CPF" }));
    await waitFor(() => expect(revealOwnerCpf).toHaveBeenCalledWith("client-1", "o1"));
    expect(await screen.findByText(TEST_CPF_FORMATTED)).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    await waitFor(() => expect(screen.queryByText(TEST_CPF_FORMATTED)).toBeNull());
    expect(screen.getByText(TEST_CPF_MASKED)).toBeTruthy();
  });

  it("shows a clear message when rate-limited (429)", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    vi.mocked(revealOwnerCpf).mockRejectedValue(new ApiError(429, "rate limited"));
    renderReview();
    await screen.findByText(TEST_CPF_MASKED);
    fireEvent.click(screen.getByRole("button", { name: "Revelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Revelar CPF" }));
    expect(
      await screen.findByText(/Muitas revelações em pouco tempo/i),
    ).toBeTruthy();
  });

  it("does not write a revealed CPF to web storage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    vi.mocked(revealOwnerCpf).mockResolvedValue(TEST_CPF);
    renderReview();
    await screen.findByText(TEST_CPF_MASKED);
    fireEvent.click(screen.getByRole("button", { name: "Revelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Revelar CPF" }));
    await screen.findByText(TEST_CPF_FORMATTED);
    const leaked = setItem.mock.calls.some((args) =>
      args.some((a) => typeof a === "string" && a.includes(TEST_CPF)),
    );
    expect(leaked).toBe(false);
    setItem.mockRestore();
  });
});

describe("ClientReview — documents", () => {
  it("marks present types as sent and missing types as pending", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    renderReview();
    // Present document → "Enviado em …"
    expect(await screen.findByText(/Enviado em/)).toBeTruthy();
    // A standard type with no upload → "Pendente"
    expect(screen.getAllByText("Pendente").length).toBeGreaterThan(0);
  });

  it("opens the signed URL in a new tab and closes it on failure", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    vi.mocked(accessDocument).mockResolvedValue("https://signed.example/doc");
    const fakeWin = { opener: {}, location: { href: "" }, close: vi.fn() };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(fakeWin as unknown as Window);
    renderReview();
    await screen.findByText(/Enviado em/);
    const openButtons = screen.getAllByRole("button", { name: "Abrir" });
    const enabled = openButtons.find((b) => !(b as HTMLButtonElement).disabled)!;
    fireEvent.click(enabled);
    await waitFor(() => expect(accessDocument).toHaveBeenCalledWith("client-1", "d1"));
    await waitFor(() => expect(fakeWin.location.href).toBe("https://signed.example/doc"));

    // Failure path: the pre-opened tab is closed.
    fakeWin.location.href = "";
    vi.mocked(accessDocument).mockRejectedValue(new Error("boom"));
    fireEvent.click(enabled);
    await waitFor(() => expect(fakeWin.close).toHaveBeenCalled());
    openSpy.mockRestore();
  });
});

describe("ClientReview — owners CRUD", () => {
  it("validates the CPF before creating", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    renderReview();
    await screen.findByText("Sócios e beneficiários finais");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar sócio" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByText("Nome completo").parentElement!.querySelector("input")!, {
      target: { value: "Novo Sócio" },
    });
    const cpfInput = within(dialog).getByPlaceholderText("000.000.000-00");
    fireEvent.change(cpfInput, { target: { value: "12345678901" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(within(dialog).getByText("CPF inválido. Confira os dígitos.")).toBeTruthy();
    expect(addOwner).not.toHaveBeenCalled();
  });

  it("requires a PEP position when the owner is a PEP", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    renderReview();
    await screen.findByText("Sócios e beneficiários finais");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar sócio" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByText("Nome completo").parentElement!.querySelector("input")!, {
      target: { value: "Político" },
    });
    fireEvent.change(within(dialog).getByPlaceholderText("000.000.000-00"), {
      target: { value: TEST_CPF },
    });
    fireEvent.click(within(dialog).getByLabelText("É PEP (pessoa exposta politicamente)"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(within(dialog).getByText("Informe o cargo do PEP.")).toBeTruthy();
    expect(addOwner).not.toHaveBeenCalled();
  });

  it("creates an owner and refreshes from the returned detail", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    vi.mocked(addOwner).mockResolvedValue(
      makeDetail({ owners: [...makeDetail().owners, {
        id: "o2", fullName: "Novo Sócio", cpfMasked: TEST_CPF_MASKED, cpfRevealable: true,
        ownershipPercent: 10, role: null, isPep: false, pepRole: null, pepEndedAt: null,
        relatedToPep: false, notes: null,
      }] }),
    );
    renderReview();
    await screen.findByText("Sócios e beneficiários finais");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar sócio" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByText("Nome completo").parentElement!.querySelector("input")!, {
      target: { value: "Novo Sócio" },
    });
    fireEvent.change(within(dialog).getByPlaceholderText("000.000.000-00"), {
      target: { value: TEST_CPF },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(addOwner).toHaveBeenCalled());
    const payload = vi.mocked(addOwner).mock.calls[0]![1];
    expect(payload.cpf).toBe(TEST_CPF);
    expect(await screen.findByText("Novo Sócio")).toBeTruthy();
  });

  it("shows a friendly message when ownership exceeds 100%", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    vi.mocked(addOwner).mockRejectedValue(
      new ApiError(422, "backend text", "OWNERSHIP_SUM_EXCEEDED"),
    );
    renderReview();
    await screen.findByText("Sócios e beneficiários finais");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar sócio" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByText("Nome completo").parentElement!.querySelector("input")!, {
      target: { value: "Novo Sócio" },
    });
    fireEvent.change(within(dialog).getByPlaceholderText("000.000.000-00"), {
      target: { value: TEST_CPF },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(
      await within(dialog).findByText("A soma da participação dos sócios não pode passar de 100%."),
    ).toBeTruthy();
  });

  it("edits an owner without sending the current CPF", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    vi.mocked(updateOwner).mockResolvedValue(makeDetail());
    renderReview();
    await screen.findByText("Sócios e beneficiários finais");
    fireEvent.click(screen.getByRole("button", { name: "Editar sócio" }));
    const dialog = await screen.findByRole("dialog");
    // The CPF field starts blank on edit.
    expect((within(dialog).getByPlaceholderText("000.000.000-00") as HTMLInputElement).value).toBe("");
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(updateOwner).toHaveBeenCalled());
    const payload = vi.mocked(updateOwner).mock.calls[0]![2];
    expect(payload.cpf).toBeUndefined();
  });

  it("removes an owner with a reason", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    vi.mocked(removeOwner).mockResolvedValue(makeDetail({ owners: [] }));
    renderReview();
    await screen.findByText("Sócios e beneficiários finais");
    fireEvent.click(screen.getByRole("button", { name: "Remover sócio" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Motivo"), {
      target: { value: "Sócio saiu da sociedade." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Remover sócio" }));
    await waitFor(() =>
      expect(removeOwner).toHaveBeenCalledWith("client-1", "o1", "Sócio saiu da sociedade."),
    );
  });

  it("warns that changing owners reopens the review when approvals exist", async () => {
    vi.mocked(getClient).mockResolvedValue(
      makeDetail({ approvals: [{ approverUserId: "admin-2", decision: "APPROVE", note: null, createdAt: null }] }),
    );
    renderReview();
    await screen.findByText("Sócios e beneficiários finais");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar sócio" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Alterar sócios reabre a revisão e apaga as aprovações registradas."),
    ).toBeTruthy();
  });
});
