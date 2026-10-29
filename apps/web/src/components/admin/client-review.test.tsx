// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
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
}));

vi.mock("@/lib/admin/handoff", () => ({
  recallClientIdentity: () => ({
    companyName: "Exemplo Comércio Exterior Ltda",
    companyCnpj: "00000000000100",
  }),
}));

let identity = { userId: "admin-1", isAdmin: true, loading: false };
vi.mock("@/lib/hooks", () => ({ useAdminIdentity: () => identity }));

import { getClient, saveReview, setGrandfathered } from "@/lib/admin/compliance";
import { ClientReview } from "./client-review";

function makeDetail(over: Partial<ClientDetail> = {}): ClientDetail {
  return {
    userId: "client-1",
    accountType: "COMPANY",
    kybStatus: "APPROVED",
    complianceGrandfathered: false,
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
        cpf: "12345678901",
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
      { id: "d1", type: "CONTRATO_SOCIAL", fileName: "contrato.pdf", fileSizeKb: 120, uploadedAt: "2026-10-01T00:00:00Z" },
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
});
afterEach(cleanup);

describe("ClientReview", () => {
  it("masks CPFs and reveals on demand", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    renderReview();
    expect(await screen.findByText("•••.•••.•••-01")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Revelar" }));
    expect(await screen.findByText("123.456.789-01")).toBeTruthy();
  });

  it("forces minimum risk High and disables Baixo/Médio when the client is PEP", async () => {
    vi.mocked(getClient).mockResolvedValue(
      makeDetail({ review: { ...makeDetail().review!, isPep: true } }),
    );
    renderReview();
    await screen.findByText("Diligência");
    expect((screen.getByRole("button", { name: "Baixo" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Médio" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/risco mínimo Alto/i)).toBeTruthy();
  });

  it("blocks deciding on your own registration", async () => {
    identity = { userId: "client-1", isAdmin: true, loading: false };
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    renderReview();
    await screen.findByText("Aprovações");
    expect(
      screen.getByText("Você não pode decidir sobre o seu próprio cadastro."),
    ).toBeTruthy();
    expect((screen.getByRole("button", { name: "Aprovar" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the reopened banner after saving the diligence", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    vi.mocked(saveReview).mockResolvedValue(makeDetail());
    renderReview();
    await screen.findByText("Diligência");
    fireEvent.click(screen.getByRole("button", { name: "Salvar diligência" }));
    expect(await screen.findByText(/as aprovações anteriores foram apagadas/i)).toBeTruthy();
  });

  it("shows documents but notes opening is unavailable (data gap)", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    renderReview();
    expect(await screen.findByText("contrato.pdf")).toBeTruthy();
    expect(
      screen.getByText("A abertura de documentos ainda não está disponível nesta versão."),
    ).toBeTruthy();
  });

  it("activates the compliance exception with a required reason", async () => {
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    vi.mocked(setGrandfathered).mockResolvedValue(makeDetail({ complianceGrandfathered: true }));
    renderReview();
    await screen.findByText("Exceção de compliance");
    fireEvent.click(screen.getByRole("button", { name: "Ativar exceção" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Ativar exceção" });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText("Motivo"), {
      target: { value: "Cliente de baixo risco histórico." },
    });
    expect((confirm as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(setGrandfathered).toHaveBeenCalledWith(
        "client-1",
        true,
        "Cliente de baixo risco histórico.",
      ),
    );
  });

  it("never writes a revealed CPF to web storage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(getClient).mockResolvedValue(makeDetail());
    renderReview();
    await screen.findByText("•••.•••.•••-01");
    fireEvent.click(screen.getByRole("button", { name: "Revelar" }));
    await screen.findByText("123.456.789-01");
    const leaked = setItem.mock.calls.some((args) =>
      args.some((a) => typeof a === "string" && a.includes("12345678901")),
    );
    expect(leaked).toBe(false);
    setItem.mockRestore();
  });
});
