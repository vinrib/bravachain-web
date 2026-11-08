// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import type { BeneficiarySummary } from "@/lib/send/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const LIST: BeneficiarySummary[] = [
  { id: "usd-1", currency: "USD", railLabel: "Wire", initials: "HC", name: "Harbor Coffee Imports LLC", line: "Lead Bank · conta ••••4821" },
];
vi.mock("@/lib/send/api", () => ({
  getBeneficiaries: () => Promise.resolve(LIST),
}));

// The Valor step renders AmountStep; stub its quoting hook so the flow test
// stays focused on navigation (idle → just the amount cards, no quote call).
vi.mock("@/lib/send/use-quote", () => ({
  useQuote: () => ({ status: "idle", quote: null, error: null, refresh: () => {} }),
}));

import { SendFlow } from "./send-flow";

function renderFlow() {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <SendFlow currency="USD" />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("SendFlow", () => {
  it("opens on the Beneficiário step with the 5-step progress bar", async () => {
    renderFlow();
    expect(screen.getByText("Enviar em USD")).toBeTruthy();
    expect(screen.getByText("Para quem você vai enviar?")).toBeTruthy();
    // Progress labels present (desktop list).
    for (const label of ["Beneficiário", "Valor", "Detalhes", "Revisão", "Status"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    await screen.findByText("Harbor Coffee Imports LLC");
  });

  it("advances to the Valor step when a beneficiary is selected", async () => {
    renderFlow();
    const row = await screen.findByText("Harbor Coffee Imports LLC");
    fireEvent.click(row.closest("button")!);
    expect(screen.getByText("Quanto você vai enviar?")).toBeTruthy();
    // Valor step (AmountStep) is now rendered — its send card label is present.
    expect(screen.getByText("Você envia exatamente")).toBeTruthy();
  });

  it("goes to 'Cadastre os dados de quem vai receber' from 'Cadastrar beneficiário'", async () => {
    renderFlow();
    await screen.findByText("Harbor Coffee Imports LLC");
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar beneficiário" }));
    expect(screen.getByText("Cadastre os dados de quem vai receber")).toBeTruthy();
  });

  it("leaves the flow (back to /enviar) from the Beneficiário step", async () => {
    renderFlow();
    await screen.findByText("Harbor Coffee Imports LLC");
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(push).toHaveBeenCalledWith("/enviar");
  });
});
