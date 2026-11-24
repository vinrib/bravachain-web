// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { ToastProvider } from "@/components/toast-provider";
import { ApiError } from "@/lib/client-api";
import * as clientApi from "@/lib/client-api";
import { CompanyView } from "./company-view";

function renderView() {
  return render(
    <ToastProvider>
      <CompanyView />
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CompanyView — zero fictional data & strict error/flag guardrails", () => {
  it("when onboarding call fails, never shows 'Aprovado pela Avenia' nor any document, and shows 'Status indisponível no momento' without green badge", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/auth/me") {
        return {
          id: "u1",
          email: "real@cliente.com.br",
          name: "Cliente Real Ltda",
          kycStatus: "PENDING",
        };
      }
      if (path === "/v1/profile/branding") {
        return { companyDisplayName: "Cliente Real Ltda", companyLogoUrl: null };
      }
      if (path === "/v1/onboarding/status") {
        throw new ApiError(500, "Internal Server Error");
      }
      if (path === "/v1/limits") {
        return { avenia: null, aveniaReason: null, pixWithdrawal: null };
      }
      throw new ApiError(404, "Not found");
    });

    renderView();

    const badge = await screen.findByTestId("company-avenia-status-badge");
    expect(badge.textContent).toContain("Status indisponível no momento");
    expect(badge.className).not.toContain("text-success");
    expect(badge.className).not.toContain("bg-success");
    expect(document.body.textContent).not.toContain("Aprovado pela Avenia");
    expect(screen.queryByTestId("company-pending-counter")).toBeNull();

    // Documentos tab: error state with "Tentar de novo" and zero documents
    fireEvent.click(screen.getByRole("tab", { name: "Documentos" }));
    const docsPanel = screen.getByRole("tabpanel");
    expect(within(docsPanel).getByRole("button", { name: "Tentar de novo" })).toBeTruthy();
    expect(docsPanel.textContent).not.toContain("Contrato Social");
    expect(docsPanel.textContent).not.toContain("Cartão CNPJ");
    expect(docsPanel.textContent).not.toContain("Aprovado pela Avenia");
    expect(docsPanel.textContent).not.toContain("Pendente de envio");

    // Pendências tab: error state with "Tentar de novo" and zero invented pending items
    fireEvent.click(screen.getByRole("tab", { name: "Pendências" }));
    const pendingPanel = screen.getByRole("tabpanel");
    expect(within(pendingPanel).getByRole("button", { name: "Tentar de novo" })).toBeTruthy();
    expect(pendingPanel.textContent).not.toContain("Balanço Patrimonial");
  });

  it("when limits call fails, renders error state with 'Tentar de novo' and zero numbers", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/auth/me") {
        return {
          id: "u1",
          email: "real@cliente.com.br",
          name: "Cliente Real Ltda",
          kycStatus: "APPROVED",
        };
      }
      if (path === "/v1/profile/branding") {
        return { companyDisplayName: null, companyLogoUrl: null };
      }
      if (path === "/v1/onboarding/status") {
        return {
          kybStatus: "APPROVED",
          kybSubmittedAt: "2026-10-12T14:00:00Z",
          kybApprovedAt: "2026-10-15T14:00:00Z",
          kybRejectedReason: null,
          documents: [],
          missingDocuments: [],
        };
      }
      if (path === "/v1/limits") {
        throw new ApiError(503, "Service Unavailable");
      }
      throw new ApiError(404, "Not found");
    });

    renderView();

    const limitsTab = await screen.findByRole("tab", { name: "Limites" });
    fireEvent.click(limitsTab);

    const limitsPanel = screen.getByRole("tabpanel");
    expect(
      within(limitsPanel).getByRole("button", { name: "Tentar de novo" }),
    ).toBeTruthy();
    expect(within(limitsPanel).queryAllByRole("row")).toHaveLength(0);
    // No fictional limit figures or percentages anywhere in the Limites panel
    expect(limitsPanel.textContent).not.toMatch(/\d/);
  });

  it("with default flags OFF and minimal/failing APIs, never renders 'Empresa Exemplo', '00.000.000/0001-00', 'Sócio Exemplo', 'Declaro que', or removed profile fields", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/auth/me") {
        return {
          id: "u1",
          email: "financeiro@cliente.com.br",
          name: null,
          kycStatus: "PENDING",
        };
      }
      throw new ApiError(500, "Backend unavailable");
    });

    renderView();

    await screen.findByText("financeiro@cliente.com.br");
    const fullText = document.body.textContent ?? "";

    expect(fullText).not.toContain("Empresa Exemplo");
    expect(fullText).not.toContain("00.000.000/0001-00");
    expect(fullText).not.toContain("Sócio Exemplo");
    expect(fullText).not.toContain("Declaro que");
    expect(fullText).not.toContain("Forma de Constituição");
    expect(fullText).not.toContain("Telefone");
    expect(fullText).not.toContain("Endereço Comercial");
  });

  it("shows 'Enviado em dd/mm' (America/Sao_Paulo) for uploaded docs, never 'Aprovado pela Avenia' per document, and hides upload button for unmapped document types", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/auth/me") {
        return {
          id: "u1",
          email: "financeiro@cliente.com.br",
          name: "Cliente Real Ltda",
          kycStatus: "APPROVED",
        };
      }
      if (path === "/v1/profile/branding") {
        return { companyDisplayName: "Cliente Real Ltda", companyLogoUrl: null };
      }
      if (path === "/v1/onboarding/status") {
        return {
          kybStatus: "APPROVED",
          kybSubmittedAt: "2026-10-12T14:00:00Z",
          kybApprovedAt: "2026-10-15T14:00:00Z",
          kybRejectedReason: null,
          documents: [
            {
              id: "doc-real-1",
              type: "CONTRATO_SOCIAL",
              fileName: "contrato-real.pdf",
              fileSizeKb: 256,
              // 2026-10-15T01:30:00Z is 2026-10-14 22:30 in America/Sao_Paulo (-03:00)
              uploadedAt: "2026-10-15T01:30:00.000Z",
            },
          ],
          missingDocuments: ["FATURAMENTO", "CUSTOM_UNMAPPED_DOC"],
        };
      }
      if (path === "/v1/limits") {
        return { avenia: null, aveniaReason: "Subconta sem limites", pixWithdrawal: null };
      }
      throw new ApiError(404, "Not found");
    });

    renderView();

    // Global KYB status badge CAN show "Aprovado pela Avenia"
    const badge = await screen.findByTestId("company-avenia-status-badge");
    expect(badge.textContent).toContain("Aprovado pela Avenia");

    // Inside Documentos tab, NO individual document may say "Aprovado pela Avenia"
    fireEvent.click(screen.getByRole("tab", { name: "Documentos" }));
    const docsPanel = screen.getByRole("tabpanel");
    expect(docsPanel.textContent).not.toContain("Aprovado pela Avenia");
    expect(docsPanel.textContent).toContain("Enviado em 14/10");
    expect(docsPanel.textContent).toContain("Pendente de envio");

    // Only the mapped backend type (FATURAMENTO) has an upload button; CUSTOM_UNMAPPED_DOC does NOT
    const uploadButtons = within(docsPanel).getAllByRole("button", {
      name: /Enviar arquivo/,
    });
    expect(uploadButtons).toHaveLength(1);
  });

  it("with PEP flag ON, never pre-checks the checkbox and never fabricates 'Sócio Exemplo' partners", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/auth/me") {
        return {
          id: "u1",
          email: "financeiro@cliente.com.br",
          name: "Cliente Real Ltda",
          kycStatus: "APPROVED",
        };
      }
      if (path === "/v1/profile/branding") {
        return { companyDisplayName: "Cliente Real Ltda", companyLogoUrl: null };
      }
      if (path === "/v1/onboarding/status") {
        return {
          kybStatus: "APPROVED",
          kybSubmittedAt: null,
          kybApprovedAt: null,
          kybRejectedReason: null,
          documents: [],
          missingDocuments: [],
        };
      }
      if (path === "/v1/limits") {
        return { avenia: null, aveniaReason: null, pixWithdrawal: null };
      }
      throw new ApiError(404, "Not found");
    });

    render(
      <ToastProvider>
        <CompanyView showPepSection={true} />
      </ToastProvider>,
    );

    const checkbox = (await screen.findByRole("checkbox")) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(document.body.textContent).not.toContain("Sócio Exemplo");
    expect(document.body.textContent).toContain(
      "Nenhum sócio ou beneficiário final cadastrado.",
    );
  });
});
