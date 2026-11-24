// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ToastProvider } from "@/components/toast-provider";
import { COMPANY_COPY } from "@/lib/company/copy";
import type { CompanyBundle } from "@/lib/company/types";
import * as companyApi from "@/lib/company/api";
import { CompanyView } from "./company-view";

function makeBundle(overrides: Partial<CompanyBundle> = {}): CompanyBundle {
  return {
    profile: {
      legalName: "Exportadora Real Ltda",
      cnpj: "12.345.678/0001-99",
      cnae: "46.37-1-99",
      email: "financeiro@exportadora-real.com.br",
      aveniaStatusKind: "approved",
      aveniaStatusLabel: "Aprovado pela Avenia",
    },
    profileError: false,
    aveniaStatusKind: "approved",
    aveniaStatusLabel: "Aprovado pela Avenia",
    pepPartners: [
      {
        id: "ubo-1",
        name: "Representante Real A",
        role: "Sócio Administrador",
        ownership: "60%",
        cpfMasked: "***.456.789-**",
        isPep: false,
      },
    ],
    documents: [
      {
        id: "doc-1",
        apiType: "CONTRATO_SOCIAL",
        name: "Contrato Social Consolidado",
        category: "Cadastro societário",
        fileName: "Contrato_Social.pdf",
        uploadedAtLabel: "12/10/2026",
        uploadedDayMonthLabel: "12/10",
        kind: "uploaded",
        statusLabel: "Enviado em 12/10",
      },
      {
        id: "FATURAMENTO",
        apiType: "FATURAMENTO",
        name: "Balanço Patrimonial / DRE (Último Exercício)",
        category: "Demonstrações financeiras",
        fileName: null,
        uploadedAtLabel: null,
        uploadedDayMonthLabel: null,
        kind: "pending",
        statusLabel: "Pendente de envio",
      },
    ],
    onboardingError: false,
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
    ],
    limitsError: false,
    limitsUnavailableReason: null,
    ...overrides,
  };
}

function renderView(showPepSection = false) {
  return render(
    <ToastProvider>
      <CompanyView showPepSection={showPepSection} />
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.spyOn(companyApi, "fetchCompanyBundle").mockResolvedValue(makeBundle());
  vi.spyOn(companyApi, "submitPartnerPepDeclaration").mockImplementation(
    async (partnerId, isPep) => ({ partnerId, isPep, persisted: false }),
  );
  vi.spyOn(companyApi, "uploadCompanyDocument").mockImplementation(
    async (doc, file) => ({
      ...doc,
      id: "doc-5-server-id",
      fileName: file.name,
      uploadedAtLabel: "23/11/2026",
      uploadedDayMonthLabel: "23/11",
      kind: "uploaded",
      statusLabel: "Enviado em 23/11",
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CompanyView (/empresa)", () => {
  it("renders header, global Avenia status badge, 4 tabs with pending counter, and real Perfil fields without PEP by default", async () => {
    renderView(false);

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

    // Real profile fields present
    expect(screen.getByText("Razão Social")).toBeTruthy();
    expect(screen.getByText("CNPJ")).toBeTruthy();
    expect(screen.getByText("12.345.678/0001-99")).toBeTruthy();
    expect(screen.getByText("E-mail")).toBeTruthy();
    expect(
      screen.getByText("financeiro@exportadora-real.com.br"),
    ).toBeTruthy();
    expect(screen.getByText("Atividade Principal (CNAE)")).toBeTruthy();

    // PEP section hidden by default when flag is OFF
    expect(
      screen.queryByText("Declaração de PEP dos sócios e beneficiários finais"),
    ).toBeNull();
    expect(screen.queryByText(/Declaro que/)).toBeNull();
  });

  it("when PEP flag is enabled, renders unchecked checkbox and toggles partner locally without emitting any 'Informação enviada à Avenia' toast", async () => {
    renderView(true);

    const checkbox = (await screen.findByLabelText(
      COMPANY_COPY.pep.declarationCheckbox,
    )) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    const toggleButtons = screen.getAllByRole("button", {
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

    // Must never show "Informação enviada à Avenia" toast while stubbed
    expect(document.body.textContent).not.toContain(
      "Informação enviada à Avenia",
    );
  });

  it("uploads a pending document using real response body, displays 'Enviado em dd/mm' (never per-doc approval), shows toast, and empties Pendências", async () => {
    renderView(false);

    const docsTab = await screen.findByRole("tab", { name: "Documentos" });
    fireEvent.click(docsTab);

    const docsPanel = screen.getByRole("tabpanel");
    expect(
      within(docsPanel).getByText("Contrato Social Consolidado"),
    ).toBeTruthy();
    expect(within(docsPanel).getByText("Enviado em 12/10")).toBeTruthy();
    expect(within(docsPanel).getByText("Pendente de envio")).toBeTruthy();
    expect(docsPanel.textContent).not.toContain("Aprovado pela Avenia");

    const fileInput = screen.getByLabelText(
      /Enviar arquivo — Balanço Patrimonial/,
    );
    const pdf = new File(["%PDF-1.4"], "dre-2026.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(fileInput, { target: { files: [pdf] } });

    await waitFor(() => {
      expect(within(docsPanel).getByText("Enviado em 23/11")).toBeTruthy();
    });

    expect(
      screen.getByText("Documento enviado. A análise é feita pela Avenia."),
    ).toBeTruthy();
    expect(screen.queryByTestId("company-pending-counter")).toBeNull();
    expect(docsPanel.textContent).not.toContain("Aprovado pela Avenia");

    // Switching to Pendências now shows clean empty state
    fireEvent.click(screen.getByRole("tab", { name: "Pendências" }));
    expect(
      screen.getByText("Nenhum documento pendente de envio."),
    ).toBeTruthy();
  });

  it("renders Limites table only with real currencies returned by API, Entrada/Saída columns, Taupe progress bar, and informative modal", async () => {
    renderView(false);

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
    expect(screen.queryByText("EUR")).toBeNull();
    expect(screen.getByText("65.000 / 250.000 BRL")).toBeTruthy();

    const bars = screen.getAllByTestId("company-limit-progress-bar");
    expect(bars).toHaveLength(4);
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
      screen
        .getByRole("tab", { name: "Documentos" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });
});
