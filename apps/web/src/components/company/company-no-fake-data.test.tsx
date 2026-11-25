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
import { ApiError } from "@/lib/client-api";
import * as clientApi from "@/lib/client-api";
import { CompanyView } from "./company-view";

function renderView(showPepSection = false) {
  return render(
    <ToastProvider>
      <CompanyView showPepSection={showPepSection} />
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
      if (path === "/v1/onboarding/company") {
        return { legalName: "Cliente Real Ltda", cnpj: "12345678000199", cnae: null };
      }
      if (path === "/auth/me") {
        return {
          id: "u1",
          email: "real@cliente.com.br",
          name: "Cliente Real Ltda",
          kycStatus: "PENDING",
        };
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

    await waitFor(() => {
      const badge = screen.getByTestId("company-avenia-status-badge");
      expect(badge.textContent).toContain("Status indisponível no momento");
      expect(badge.className).not.toContain("text-success");
      expect(badge.className).not.toContain("bg-success");
    });
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

  it("when limits call fails, renders error state with 'Tentar de novo' and zero numbers without affecting Perfil", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/v1/onboarding/company") {
        return { legalName: "Cliente Real Ltda", cnpj: "12345678000199", cnae: "6201-5/01" };
      }
      if (path === "/auth/me") {
        return {
          id: "u1",
          email: "real@cliente.com.br",
          name: "Cliente Real Ltda",
          kycStatus: "APPROVED",
        };
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

    await screen.findByText("12.345.678/0001-99");

    const limitsTab = screen.getByRole("tab", { name: "Limites" });
    fireEvent.click(limitsTab);

    const limitsPanel = screen.getByRole("tabpanel");
    await within(limitsPanel).findByRole("button", { name: "Tentar de novo" });
    expect(within(limitsPanel).queryAllByRole("row")).toHaveLength(0);
    // No fictional limit figures or percentages anywhere in the Limites panel
    expect(limitsPanel.textContent).not.toMatch(/\d/);
  });

  it("with default flags OFF and minimal/failing APIs, never renders 'Empresa Exemplo', 'Razão Social', '00.000.000/0001-00', 'Sócio Exemplo', 'Declaro que', or removed profile fields", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/v1/onboarding/company") {
        return { legalName: null, cnpj: null, cnae: null };
      }
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
    expect(fullText).not.toContain("Razão Social");
    expect(fullText).not.toContain("00.000.000/0001-00");
    expect(fullText).not.toContain("Sócio Exemplo");
    expect(fullText).not.toContain("Declaro que");
    expect(fullText).not.toContain("Forma de Constituição");
    expect(fullText).not.toContain("Telefone");
    expect(fullText).not.toContain("Endereço Comercial");
  });

  it("shows 'Enviado em dd/mm' (America/Sao_Paulo) for uploaded docs, never 'Aprovado pela Avenia' per document, and hides upload button for unmapped document types", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/v1/onboarding/company") {
        return { legalName: "Cliente Real Ltda", cnpj: null, cnae: null };
      }
      if (path === "/auth/me") {
        return {
          id: "u1",
          email: "financeiro@cliente.com.br",
          name: "Cliente Real Ltda",
          kycStatus: "APPROVED",
        };
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

    await waitFor(() => {
      expect(
        screen.getByTestId("company-avenia-status-badge").textContent,
      ).toContain("Aprovado pela Avenia");
    });

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
      if (path === "/v1/onboarding/company") {
        return { legalName: "Cliente Real Ltda", cnpj: null, cnae: null };
      }
      if (path === "/auth/me") {
        return {
          id: "u1",
          email: "financeiro@cliente.com.br",
          name: "Cliente Real Ltda",
          kycStatus: "APPROVED",
        };
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

    renderView(true);

    const checkbox = (await screen.findByRole("checkbox")) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(document.body.textContent).not.toContain("Sócio Exemplo");
    expect(document.body.textContent).toContain(
      "Nenhum sócio ou beneficiário final cadastrado.",
    );
  });

  it("never displays a person's displayName/name as legalName or card title, falling back to 'Empresa'", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/v1/onboarding/company") {
        return { legalName: null, cnpj: null, cnae: null };
      }
      if (path === "/auth/me") {
        return {
          id: "u1",
          email: "vinicius@empresa.com.br",
          name: "Vinicius Ribeiro de Souza",
          kycStatus: "APPROVED",
        };
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

    renderView();

    await screen.findByText("vinicius@empresa.com.br");
    const panel = screen.getByRole("tabpanel");
    const cardHeading = within(panel).getByRole("heading", { level: 2 });
    expect(cardHeading.textContent).toBe("Empresa");
    expect(panel.textContent).not.toContain("Vinicius Ribeiro de Souza");
    expect(panel.textContent).not.toContain("Razão Social");
    expect(panel.textContent).not.toContain("Nome da empresa");
  });

  it("hides each individual null field on Perfil (legalName, cnpj, cnae) while showing non-null fields", async () => {
    const cases: Array<{
      payload: { legalName: string | null; cnpj: string | null; cnae: string | null };
      expectedHeading: string;
      presentLabels: string[];
      absentLabels: string[];
    }> = [
      {
        payload: { legalName: null, cnpj: "12345678000199", cnae: "6201-5/01" },
        expectedHeading: "Empresa",
        presentLabels: ["CNPJ", "CNAE", "E-mail"],
        absentLabels: ["Nome da empresa"],
      },
      {
        payload: { legalName: "Acme Comércio Ltda", cnpj: null, cnae: "6201-5/01" },
        expectedHeading: "Acme Comércio Ltda",
        presentLabels: ["Nome da empresa", "CNAE", "E-mail"],
        absentLabels: ["CNPJ"],
      },
      {
        payload: { legalName: "Acme Comércio Ltda", cnpj: "12345678000199", cnae: null },
        expectedHeading: "Acme Comércio Ltda",
        presentLabels: ["Nome da empresa", "CNPJ", "E-mail"],
        absentLabels: ["CNAE"],
      },
    ];

    for (const testCase of cases) {
      vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
        if (path === "/v1/onboarding/company") return testCase.payload;
        if (path === "/auth/me") {
          return { id: "u1", email: "contato@acme.com.br", name: null, kycStatus: "APPROVED" };
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
          return { avenia: null, aveniaReason: null };
        }
        throw new ApiError(404, "Not found");
      });

      renderView();
      await screen.findByText("contato@acme.com.br");
      const panel = screen.getByRole("tabpanel");
      expect(within(panel).getByRole("heading", { level: 2 }).textContent).toBe(
        testCase.expectedHeading,
      );
      for (const label of testCase.presentLabels) {
        expect(within(panel).getByText(label)).toBeTruthy();
      }
      for (const label of testCase.absentLabels) {
        expect(within(panel).queryByText(label)).toBeNull();
      }
      expect(panel.textContent).not.toContain("Razão Social");
      cleanup();
      vi.restoreAllMocks();
    }
  });

  it("shows Perfil skeleton while /v1/onboarding/company is loading without affecting Header or other cards", async () => {
    let resolveCompany!: (value: unknown) => void;
    const companyPromise = new Promise((resolve) => {
      resolveCompany = resolve;
    });

    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/v1/onboarding/company") return companyPromise;
      if (path === "/auth/me") {
        return { id: "u1", email: "contato@real.com.br", name: null, kycStatus: "APPROVED" };
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
        return { avenia: null, aveniaReason: null };
      }
      throw new ApiError(404, "Not found");
    });

    renderView(true);

    // Header badge and PEP card render while Perfil card shows skeleton
    await waitFor(() => {
      expect(
        screen.getByTestId("company-avenia-status-badge").textContent,
      ).toContain("Aprovado pela Avenia");
    });
    expect(screen.getByTestId("company-profile-skeleton")).toBeTruthy();
    expect(
      screen.getByText("Declaração de PEP dos sócios e beneficiários finais"),
    ).toBeTruthy();

    // Resolving company data replaces skeleton with real data
    resolveCompany({
      legalName: "Exportadora Real Ltda",
      cnpj: "12345678000199",
      cnae: "46.37-1-99",
    });

    await screen.findByText("12.345.678/0001-99");
    expect(screen.queryByTestId("company-profile-skeleton")).toBeNull();
  });

  it("shows Perfil error with 'Tentar de novo' on HTTP error or extra response key without affecting other cards", async () => {
    for (const mode of ["http-error", "extra-key"] as const) {
      let attempt = 0;
      vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
        if (path === "/v1/onboarding/company") {
          attempt += 1;
          if (attempt === 1) {
            if (mode === "http-error") {
              throw new ApiError(500, "Internal Server Error");
            }
            return {
              legalName: "Exportadora Real Ltda",
              cnpj: "12345678000199",
              cnae: "46.37-1-99",
              unexpectedExtraField: "invalid",
            };
          }
          return {
            legalName: "Exportadora Real Ltda",
            cnpj: "12345678000199",
            cnae: "46.37-1-99",
          };
        }
        if (path === "/auth/me") {
          return { id: "u1", email: "real@empresa.com.br", name: null, kycStatus: "APPROVED" };
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
          return {
            avenia: {
              blocked: false,
              byCurrency: [
                {
                  currency: "BRL",
                  period: "monthly",
                  referenceMonth: "2026-11",
                  unlocked: true,
                  fiatIn: { max: 100000, used: 43000, available: 57000, usedPct: "43.00" },
                  fiatOut: { max: 100000, used: 0, available: 100000, usedPct: "0.00" },
                  chainIn: { max: null, used: null, available: null, usedPct: null },
                  chainOut: { max: null, used: null, available: null, usedPct: null },
                },
              ],
            },
            aveniaReason: null,
          };
        }
        throw new ApiError(404, "Not found");
      });

      renderView(true);

      const panel = await screen.findByRole("tabpanel");
      const retryBtn = await within(panel).findByRole("button", {
        name: "Tentar de novo",
      });
      expect(retryBtn).toBeTruthy();

      // Other cards are completely unaffected
      await waitFor(() => {
        expect(
          screen.getByTestId("company-avenia-status-badge").textContent,
        ).toContain("Aprovado pela Avenia");
      });
      expect(
        screen.getByText("Declaração de PEP dos sócios e beneficiários finais"),
      ).toBeTruthy();

      // Clicking retry recovers Perfil (heading + "Nome da empresa" field)
      fireEvent.click(retryBtn);
      await screen.findByText("12.345.678/0001-99");
      expect(screen.getAllByText("Exportadora Real Ltda")).toHaveLength(2);
      expect(
        screen.getByRole("heading", { level: 2, name: "Exportadora Real Ltda" }),
      ).toBeTruthy();

      cleanup();
      vi.restoreAllMocks();
    }
  });

  it("renders Limites with usedPct 43.00, 0.00, null, 150.00 (>100% visual overflow), unlocked true/false/null, referenceMonth null, and absent currencies omitted", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/v1/onboarding/company") {
        return { legalName: "Exportadora Real Ltda", cnpj: "12345678000199", cnae: null };
      }
      if (path === "/auth/me") {
        return { id: "u1", email: "real@empresa.com.br", name: null, kycStatus: "APPROVED" };
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
        return {
          avenia: {
            blocked: false,
            byCurrency: [
              {
                currency: "BRL",
                period: "monthly",
                referenceMonth: "2026-11",
                unlocked: true,
                fiatIn: { max: 100000, used: 43000, available: 57000, usedPct: "43.00" },
                fiatOut: { max: 100000, used: 0, available: 100000, usedPct: "0.00" },
                chainIn: { max: null, used: null, available: null, usedPct: null },
                chainOut: { max: null, used: null, available: null, usedPct: null },
              },
              {
                currency: "USD",
                period: "monthly",
                referenceMonth: null,
                unlocked: null,
                fiatIn: { max: 50000, used: 75000, available: 0, usedPct: "150.00" },
                fiatOut: { max: 50000, used: 10000, available: 40000, usedPct: null },
                chainIn: { max: null, used: null, available: null, usedPct: null },
                chainOut: { max: null, used: null, available: null, usedPct: null },
              },
              {
                currency: "EUR",
                period: "monthly",
                referenceMonth: "2026-11",
                unlocked: false,
                fiatIn: { max: null, used: null, available: null, usedPct: null },
                fiatOut: { max: null, used: null, available: null, usedPct: null },
                chainIn: { max: null, used: null, available: null, usedPct: null },
                chainOut: { max: null, used: null, available: null, usedPct: null },
              },
            ],
          },
          aveniaReason: null,
        };
      }
      throw new ApiError(404, "Not found");
    });

    renderView();

    fireEvent.click(await screen.findByRole("tab", { name: "Limites" }));
    const panel = screen.getByRole("tabpanel");

    await within(panel).findByText("BRL");
    expect(within(panel).getByText("USD")).toBeTruthy();
    expect(within(panel).getByText("EUR")).toBeTruthy();
    // Global (USD) was NOT in byCurrency -> must NOT be invented
    expect(within(panel).queryByText("Global (USD)")).toBeNull();

    // Period labels
    expect(within(panel).getByText("Uso mensal · nov/26")).toBeTruthy();
    expect(
      within(panel).getByText("Uso mensal · mês de referência não informado"),
    ).toBeTruthy();

    // Exact usedPct strings
    expect(within(panel).getByText("43,00%")).toBeTruthy();
    expect(within(panel).getByText("0,00%")).toBeTruthy();
    expect(within(panel).getByText("150,00%")).toBeTruthy();

    // > 100% bar clamped visually at 100% with visible exceeded indication
    const bars = within(panel).getAllByTestId("company-limit-progress-bar");
    // 3 bars total: BRL entry (43%), BRL exit (0%), USD entry (150% -> 100% exceeded); USD exit has usedPct=null (no bar)
    expect(bars).toHaveLength(3);
    expect(bars[0]?.style.width).toBe("43%");
    expect(bars[1]?.style.width).toBe("0%");
    expect(bars[2]?.style.width).toBe("100%");
    expect(bars[2]?.getAttribute("data-exceeded")).toBe("true");
    expect(within(panel).getByTestId("company-limit-exceeded-badge")).toBeTruthy();

    // USD exit has usedPct: null -> shows amount without fabricating 20%
    expect(within(panel).getByText("10.000 / 50.000 USD")).toBeTruthy();
    expect(panel.textContent).not.toContain("20%");
    expect(panel.textContent).not.toContain("20,00%");
    expect(
      within(panel).getByTestId("company-limit-pct-unavailable"),
    ).toBeTruthy();

    // EUR unlocked === false -> "Moeda ainda não habilitada" in place of bars
    expect(within(panel).getByText("Moeda ainda não habilitada")).toBeTruthy();

    // USD unlocked === null -> normal row without claiming enabled or disabled
    const usdRow = within(panel).getByText("USD").closest("tr");
    expect(usdRow?.textContent).not.toContain("habilitada");
    expect(usdRow?.textContent).not.toContain("Habilitada");
  });

  it("renders neutral message on Limites HTTP 403 without technical error or retry button", async () => {
    vi.spyOn(clientApi, "apiFetch").mockImplementation(async (path: string) => {
      if (path === "/v1/onboarding/company") {
        return { legalName: "Exportadora Real Ltda", cnpj: "12345678000199", cnae: null };
      }
      if (path === "/auth/me") {
        return { id: "u1", email: "real@empresa.com.br", name: null, kycStatus: "SUBMITTED" };
      }
      if (path === "/v1/onboarding/status") {
        return {
          kybStatus: "SUBMITTED",
          kybSubmittedAt: "2026-10-12T14:00:00Z",
          kybApprovedAt: null,
          kybRejectedReason: null,
          documents: [],
          missingDocuments: [],
        };
      }
      if (path === "/v1/limits") {
        throw new ApiError(403, "Forbidden");
      }
      throw new ApiError(404, "Not found");
    });

    renderView();

    fireEvent.click(await screen.findByRole("tab", { name: "Limites" }));
    const panel = screen.getByRole("tabpanel");

    await within(panel).findByText(
      "Os limites ficam disponíveis depois que a Avenia aprovar o cadastro.",
    );
    expect(
      within(panel).queryByRole("button", { name: "Tentar de novo" }),
    ).toBeNull();
    expect(within(panel).queryAllByRole("row")).toHaveLength(0);
    expect(panel.textContent).not.toMatch(/\d/);
  });
});
