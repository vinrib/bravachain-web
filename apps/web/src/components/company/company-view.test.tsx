// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ToastProvider } from "@/components/toast-provider";
import { COMPANY_COPY } from "@/lib/company/copy";
import type { CompanyBundle } from "@/lib/company/types";
import * as companyApi from "@/lib/company/api";
import { CompanyView } from "./company-view";

function makeBundle(): CompanyBundle {
  return {
    profile: {
      legalName: "Empresa Exemplo Exportadora Ltda",
      entityType: "LTDA",
      cnpj: "00.000.000/0001-00",
      email: "contato@exemplo.com.br",
      phone: "+55 00 00000-0000",
      cnae: "46.37-1-99 — Comércio atacadista",
      address: "Rua Exemplo, 100 — Rio Branco, AC",
      aveniaStatusKind: "approved",
      aveniaStatusLabel: "Aprovado pela Avenia",
      usesFallbackFields: true,
    },
    pepPartners: [
      {
        id: "ubo-1",
        name: "Sócio Exemplo A",
        role: "Sócio Administrador",
        ownership: "60%",
        cpfMasked: "***.000.000-**",
        isPep: false,
      },
      {
        id: "ubo-2",
        name: "Sócia Exemplo B",
        role: "Sócia Diretora",
        ownership: "40%",
        cpfMasked: "***.111.222-**",
        isPep: false,
      },
    ],
    documents: [
      {
        id: "doc-1",
        apiType: "CONTRATO_SOCIAL",
        name: "Contrato Social Consolidado",
        category: "Cadastro societário",
        fileName: "Contrato_Social_Exemplo.pdf",
        uploadedAtLabel: "12/10/2026",
        status: "Aprovado pela Avenia",
      },
      {
        id: "doc-5",
        apiType: "FATURAMENTO",
        name: "Balanço Patrimonial / DRE (Último Exercício)",
        category: "Demonstrações financeiras",
        fileName: null,
        uploadedAtLabel: null,
        status: "Pendente de envio",
      },
    ],
    limits: [
      {
        id: "GLOBAL",
        scope: "GLOBAL",
        label: "Global (USD)",
        isGlobal: true,
        entry: { used: 42500, max: 100000, unit: "USD" },
        exit: { used: 12000, max: 100000, unit: "USD" },
      },
      {
        id: "BRL",
        scope: "BRL",
        label: "BRL",
        isGlobal: false,
        entry: { used: 65000, max: 250000, unit: "BRL" },
        exit: { used: 68900, max: 250000, unit: "BRL" },
      },
      {
        id: "USD",
        scope: "USD",
        label: "USD",
        isGlobal: false,
        entry: { used: 42500, max: 100000, unit: "USD" },
        exit: { used: 12000, max: 100000, unit: "USD" },
      },
      {
        id: "EUR",
        scope: "EUR",
        label: "EUR",
        isGlobal: false,
        entry: { used: 18200, max: 80000, unit: "EUR" },
        exit: { used: 0, max: 80000, unit: "EUR" },
      },
    ],
  };
}

function renderView() {
  return render(
    <ToastProvider>
      <CompanyView />
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.spyOn(companyApi, "fetchCompanyBundle").mockResolvedValue(makeBundle());
  vi.spyOn(companyApi, "submitPartnerPepDeclaration").mockImplementation(
    async (partnerId, isPep) => ({ partnerId, isPep }),
  );
  vi.spyOn(companyApi, "uploadCompanyDocument").mockImplementation(
    async (doc, file) => ({
      ...doc,
      fileName: file.name,
      uploadedAtLabel: "23/11/2026",
      status: "Enviado — em análise pela Avenia",
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CompanyView (/empresa)", () => {
  it("renders header, Avenia status badge, 4 tabs with pending counter, and Perfil tab", async () => {
    renderView();

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Empresa",
    });
    expect(heading).toBeTruthy();
    expect(
      screen.getByTestId("company-avenia-status-badge").textContent,
    ).toContain("Status do cadastro na Avenia: Aprovado pela Avenia");

    const tablist = screen.getByRole("tablist");
    expect(within(tablist).getByRole("tab", { name: "Perfil" })).toBeTruthy();
    expect(
      within(tablist).getByRole("tab", { name: "Documentos" }),
    ).toBeTruthy();
    expect(
      within(tablist).getByRole("tab", { name: /Pendências/ }),
    ).toBeTruthy();
    expect(within(tablist).getByRole("tab", { name: "Limites" })).toBeTruthy();
    expect(screen.getByTestId("company-pending-counter").textContent).toBe("1");

    // Cadastral fields
    expect(screen.getByText("Razão Social")).toBeTruthy();
    expect(screen.getByText("Forma de Constituição")).toBeTruthy();
    expect(screen.getByText("CNPJ")).toBeTruthy();
    expect(screen.getByText("00.000.000/0001-00")).toBeTruthy();
    expect(screen.getByText("E-mail")).toBeTruthy();
    expect(screen.getByText("Telefone")).toBeTruthy();
    expect(screen.getByText("Atividade Principal (CNAE)")).toBeTruthy();
    expect(screen.getByText("Endereço Comercial")).toBeTruthy();

    // PEP section
    expect(
      screen.getByText("Declaração de PEP dos sócios e beneficiários finais"),
    ).toBeTruthy();
    expect(screen.getByText("Sócio Exemplo A")).toBeTruthy();
    expect(screen.getByText("***.000.000-**")).toBeTruthy();
    expect(screen.getAllByText("Declaração registrada")).toHaveLength(2);
    expect(
      screen.getByLabelText(COMPANY_COPY.pep.declarationCheckbox),
    ).toBeTruthy();
  });

  it("toggles partner PEP status between NÃO (Declaração registrada) and SIM (Informação enviada à Avenia para análise)", async () => {
    renderView();

    const toggleButtons = await screen.findAllByRole("button", {
      name: /Declarado PEP:/,
    });
    const firstToggle = toggleButtons[0];
    expect(firstToggle).toBeDefined();
    if (!firstToggle) return;

    expect(firstToggle.textContent).toContain("Declarado PEP: NÃO");

    fireEvent.click(firstToggle);

    await waitFor(() => {
      expect(firstToggle.textContent).toContain("Declarado PEP: SIM");
    });
    expect(
      screen.getByText("Informação enviada à Avenia para análise"),
    ).toBeTruthy();
  });

  it("uploads a pending document, sets status to 'Enviado — em análise pela Avenia' (never approved), shows toast, and empties Pendências", async () => {
    renderView();

    const docsTab = await screen.findByRole("tab", { name: "Documentos" });
    fireEvent.click(docsTab);

    expect(screen.getByText("Contrato Social Consolidado")).toBeTruthy();
    expect(screen.getByText("Aprovado pela Avenia")).toBeTruthy();
    expect(screen.getByText("Pendente de envio")).toBeTruthy();

    const fileInput = screen.getByLabelText(
      /Enviar arquivo — Balanço Patrimonial/,
    );
    const pdf = new File(["%PDF-1.4"], "dre-2026.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(fileInput, { target: { files: [pdf] } });

    await waitFor(() => {
      expect(
        screen.getByText("Enviado — em análise pela Avenia"),
      ).toBeTruthy();
    });

    // Must show exact Avenia analysis toast and decrement pending badge
    expect(
      screen.getByText("Documento enviado. A análise é feita pela Avenia."),
    ).toBeTruthy();
    expect(screen.queryByTestId("company-pending-counter")).toBeNull();

    // Still only 1 approved doc (never auto-approved by Bravachain)
    expect(screen.getAllByText("Aprovado pela Avenia")).toHaveLength(1);

    // Switching to Pendências now shows clean empty state
    fireEvent.click(screen.getByRole("tab", { name: "Pendências" }));
    expect(
      screen.getByText("Nenhum documento pendente de envio."),
    ).toBeTruthy();
  });

  it("renders Limites table with Global (USD), BRL, USD, EUR, only Entrada/Saída columns, Taupe progress bar, and informative modal", async () => {
    renderView();

    const limitsTab = await screen.findByRole("tab", { name: "Limites" });
    fireEvent.click(limitsTab);

    expect(screen.getByText("Limites da sua conta")).toBeTruthy();
    expect(screen.getByText("Limites definidos pela Avenia.")).toBeTruthy();

    const headers = screen
      .getAllByRole("columnheader")
      .map((th) => th.textContent);
    expect(headers).toEqual(["Moeda / Escopo", "Entrada", "Saída"]);

    expect(screen.getByText("Global (USD)")).toBeTruthy();
    expect(screen.getByText("BRL")).toBeTruthy();
    expect(screen.getByText("USD")).toBeTruthy();
    expect(screen.getByText("EUR")).toBeTruthy();
    expect(screen.getByText("65.000 / 250.000 BRL")).toBeTruthy();

    const bars = screen.getAllByTestId("company-limit-progress-bar");
    expect(bars).toHaveLength(8);
    // #B5AAA6 converts to rgb(181, 170, 166) in jsdom inline style
    expect(bars[0]?.style.backgroundColor).toBe("rgb(181, 170, 166)");

    // Open "Como revisar meus limites" modal
    fireEvent.click(
      screen.getByRole("button", { name: "Como revisar meus limites" }),
    );
    expect(
      screen.getByText(
        "A revisão de limites é decidida pela Avenia. Mantenha seus documentos e demonstrações financeiras atualizados na aba Documentos.",
      ),
    ).toBeTruthy();

    // Clicking "Ir para Documentos" switches tab and closes modal
    fireEvent.click(screen.getByRole("button", { name: "Ir para Documentos" }));
    expect(
      screen.getByRole("tab", { name: "Documentos" }).getAttribute("aria-selected"),
    ).toBe("true");
  });
});
