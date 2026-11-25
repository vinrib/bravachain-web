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
import * as clientApi from "@/lib/client-api";
import * as companyApi from "@/lib/company/api";
import { CompanyView } from "./company-view";

function mockHappyApis() {
  vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
    if (path === "/v1/onboarding/company") {
      return {
        legalName: "Exportadora Real Ltda",
        cnpj: "12345678000199",
        cnae: "46.37-1-99",
      };
    }
    if (path === "/auth/me") {
      return {
        id: "u1",
        email: "financeiro@exportadora-real.com.br",
        name: "Representante Real A",
        kycStatus: "APPROVED",
      };
    }
    if (path === "/v1/onboarding/status") {
      return {
        kybStatus: "APPROVED",
        kybSubmittedAt: "2026-10-12T14:00:00Z",
        kybApprovedAt: "2026-10-13T16:00:00Z",
        kybRejectedReason: null,
        documents: [
          {
            id: "doc-1",
            type: "CONTRATO_SOCIAL",
            fileName: "Contrato_Social.pdf",
            fileSizeKb: 180,
            uploadedAt: "2026-10-12T14:00:00Z",
          },
        ],
        missingDocuments: ["FATURAMENTO"],
      };
    }
    if (path === "/v1/limits") {
      return {
        avenia: {
          blocked: false,
          byCurrency: [
            {
              currency: "*",
              period: "monthly",
              referenceMonth: "2026-11",
              unlocked: true,
              fiatIn: { max: 100000, used: 43000, available: 57000, usedPct: "43.00" },
              fiatOut: { max: 100000, used: 0, available: 100000, usedPct: "0.00" },
              chainIn: { max: null, used: null, available: null, usedPct: null },
              chainOut: { max: null, used: null, available: null, usedPct: null },
            },
            {
              currency: "BRL",
              period: "monthly",
              referenceMonth: "2026-11",
              unlocked: true,
              fiatIn: { max: 250000, used: 65000, available: 185000, usedPct: "26.00" },
              fiatOut: { max: 250000, used: 68900, available: 181100, usedPct: "27.56" },
              chainIn: { max: null, used: null, available: null, usedPct: null },
              chainOut: { max: null, used: null, available: null, usedPct: null },
            },
          ],
        },
        aveniaReason: null,
      };
    }
    throw new Error(`Unexpected path: ${path}`);
  });
}

function renderView(showPepSection = false) {
  return render(
    <ToastProvider>
      <CompanyView showPepSection={showPepSection} />
    </ToastProvider>,
  );
}

beforeEach(() => {
  mockHappyApis();
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
  it("renders header, global Avenia status badge, 4 tabs with pending counter, and real Perfil fields without 'Razão Social' or PEP by default", async () => {
    renderView(false);

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Empresa",
    });
    expect(heading).toBeTruthy();

    await waitFor(() => {
      expect(
        screen.getByTestId("company-avenia-status-badge").textContent,
      ).toContain("Status do cadastro na Avenia: Aprovado pela Avenia");
    });

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

    // Real profile fields present with new labels (NO "Razão Social")
    const panel = screen.getByRole("tabpanel");
    await within(panel).findByText("Nome da empresa");
    expect(within(panel).getByRole("heading", { level: 2 }).textContent).toBe(
      "Exportadora Real Ltda",
    );
    expect(within(panel).getByText("CNPJ")).toBeTruthy();
    expect(within(panel).getByText("12.345.678/0001-99")).toBeTruthy();
    expect(within(panel).getByText("E-mail")).toBeTruthy();
    expect(
      within(panel).getByText("financeiro@exportadora-real.com.br"),
    ).toBeTruthy();
    expect(within(panel).getByText("CNAE")).toBeTruthy();
    expect(within(panel).getByText("46.37-1-99")).toBeTruthy();
    expect(document.body.textContent).not.toContain("Razão Social");

    // PEP section hidden by default when flag is OFF
    expect(
      screen.queryByText("Declaração de PEP dos sócios e beneficiários finais"),
    ).toBeNull();
    expect(screen.queryByText(/Declaro que/)).toBeNull();
  });

  it("when PEP flag is enabled, renders unchecked checkbox and never emits 'Informação enviada à Avenia'", async () => {
    renderView(true);

    const checkbox = (await screen.findByLabelText(
      COMPANY_COPY.pep.declarationCheckbox,
    )) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    expect(document.body.textContent).not.toContain(
      "Informação enviada à Avenia",
    );
  });

  it("uploads a pending document using real response body, displays 'Enviado em dd/mm' (never per-doc approval), shows toast, and empties Pendências", async () => {
    renderView(false);

    await waitFor(() => {
      expect(screen.getByTestId("company-pending-counter").textContent).toBe("1");
    });

    const docsTab = screen.getByRole("tab", { name: "Documentos" });
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

  it("renders Limites table only with real currencies returned by API, Entrada/Saída columns, backend usedPct, Taupe progress bar, and informative modal", async () => {
    renderView(false);

    const limitsTab = await screen.findByRole("tab", { name: "Limites" });
    fireEvent.click(limitsTab);

    await screen.findByText("Global (USD)");
    expect(screen.getByText("Limites da sua conta")).toBeTruthy();
    expect(screen.getByText("Limites definidos pela Avenia.")).toBeTruthy();

    const headers = screen
      .getAllByRole("columnheader")
      .map((th) => th.textContent);
    expect(headers).toEqual(["Moeda / Escopo", "Entrada", "Saída"]);

    expect(screen.getByText("BRL")).toBeTruthy();
    expect(screen.queryByText("EUR")).toBeNull();
    expect(screen.queryByText("USD")).toBeNull();
    expect(screen.getByText("65.000 / 250.000 BRL")).toBeTruthy();
    expect(screen.getByText("43,00%")).toBeTruthy();
    expect(screen.getByText("0,00%")).toBeTruthy();
    expect(screen.getAllByText("Uso mensal · nov/26").length).toBeGreaterThan(0);

    const bars = screen.getAllByTestId("company-limit-progress-bar");
    expect(bars).toHaveLength(4);
    // #B5AAA6 converts to rgb(181, 170, 166) in jsdom inline style
    expect(bars[0]?.style.backgroundColor).toBe("rgb(181, 170, 166)");
    expect(bars[0]?.style.width).toBe("43%");
    expect(bars[1]?.style.width).toBe("0%");

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
