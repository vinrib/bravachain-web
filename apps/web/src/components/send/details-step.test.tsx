// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import type { PurposeCategory, SendCurrency, SendQuote } from "@/lib/send/types";

const CATS: PurposeCategory[] = [
  {
    name: "Serviços diversos",
    items: [{ code: "47555", name: "Serviços de consultoria", category: "Serviços diversos" }],
  },
];
vi.mock("@/lib/send/api", () => ({ getPurposeCodes: () => Promise.resolve(CATS) }));

import { DetailsStep } from "./details-step";

function quote(over: Partial<SendQuote> = {}): SendQuote {
  return {
    quoteId: "q",
    lines: { sendAmount: 10000, aveniaFee: 48, railFee: 55.4, bravachainCommission: 202, receiveAmount: 1749.93 },
    referenceRate: 5.54,
    expiresAt: null,
    isEstimate: true,
    balanceBrl: 248315.4,
    enoughBalance: true,
    invoiceRequired: false,
    messageApplied: true,
    ...over,
  };
}

const onContinue = vi.fn();
function renderStep(currency: SendCurrency, q: SendQuote = quote()) {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <DetailsStep currency={currency} quote={q} onContinue={onContinue} />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  onContinue.mockClear();
});

describe("DetailsStep", () => {
  it("labels the message as 'Mensagem do Pix' for BRL and omits the purpose", () => {
    renderStep("BRL");
    expect(screen.getByText("Mensagem do Pix")).toBeTruthy();
    expect(screen.queryByText("Finalidade do envio")).toBeNull();
  });

  it("warns when the deposit message may not reach the recipient", () => {
    renderStep("BRL", quote({ messageApplied: false }));
    expect(screen.getByText("Esta mensagem pode não aparecer para quem recebe.")).toBeTruthy();
  });

  it("requires the purpose for USD before continuing", () => {
    renderStep("USD");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByText("Selecione a finalidade para continuar.")).toBeTruthy();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("continues once a purpose is chosen", async () => {
    renderStep("USD");
    fireEvent.click(await screen.findByRole("button", { name: /Selecione a finalidade/ }));
    fireEvent.click(screen.getByText("Serviços diversos"));
    fireEvent.click(screen.getByText("Serviços de consultoria"));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ purposeCode: "47555" }),
    );
  });

  it("shows the invoice block only when the quote requires it", () => {
    const { rerender } = renderStep("USD", quote({ invoiceRequired: false }));
    expect(screen.queryByText("Anexar nota fiscal")).toBeNull();
    rerender(
      <NextIntlClientProvider locale="pt" messages={ptMessages}>
        <DetailsStep currency="USD" quote={quote({ invoiceRequired: true })} onContinue={onContinue} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("Anexar nota fiscal")).toBeTruthy();
  });
});
