// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import { ApiError } from "@/lib/client-api";
import type { SendCurrency, SendQuote } from "@/lib/send/types";

const flags = vi.hoisted(() => ({ deposito: false }));
vi.mock("@/lib/feature-flags", () => ({ featureFlags: flags }));

const quoteMock = vi.hoisted(() => ({
  current: { status: "ready", quote: null as SendQuote | null, error: null as unknown, refresh: () => {} },
}));
vi.mock("@/lib/send/use-quote", () => ({ useQuote: () => quoteMock.current }));

import { AmountStep } from "./amount-step";

function makeQuote(over: Partial<SendQuote> = {}): SendQuote {
  return {
    quoteId: "q1",
    lines: { sendAmount: 10000, aveniaFee: 48, railFee: 55.4, bravachainCommission: 202, receiveAmount: 1749.93 },
    referenceRate: 5.54,
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    isEstimate: true,
    balanceBrl: 248315.4,
    enoughBalance: true,
    invoiceRequired: false,
    ...over,
  };
}

const onContinue = vi.fn();
function renderStep(currency: SendCurrency = "USD") {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <AmountStep currency={currency} beneficiaryName="Harbor Coffee Imports LLC" onContinue={onContinue} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  flags.deposito = false;
  quoteMock.current = { status: "ready", quote: makeQuote(), error: null, refresh: () => {} };
});
afterEach(() => {
  cleanup();
  onContinue.mockClear();
});

describe("AmountStep", () => {
  it("renders the estimate lines and enables Continuar with the Avenia labels", () => {
    renderStep("USD");
    expect(screen.getByText("Valor enviado")).toBeTruthy();
    expect(screen.getByText("Taxa da Avenia")).toBeTruthy();
    expect(screen.getByText("Tarifa do trilho (Wire)")).toBeTruthy();
    expect(screen.getByText("Comissão Bravachain")).toBeTruthy();
    expect(screen.getByText("Valor que o beneficiário recebe")).toBeTruthy();
    const cont = screen.getByRole("button", { name: /Continuar/ });
    expect((cont as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(cont);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("does not show a 0-value commission line", () => {
    quoteMock.current.quote = makeQuote({
      lines: { sendAmount: 10000, aveniaFee: 48, railFee: 55.4, bravachainCommission: 0, receiveAmount: 1749.93 },
    });
    renderStep("USD");
    expect(screen.queryByText("Comissão Bravachain")).toBeNull();
  });

  it("shows the Depósito link in the insufficient notice only when the flag is on", () => {
    quoteMock.current.quote = makeQuote({ enoughBalance: false });
    flags.deposito = true;
    renderStep("USD");
    const dep = screen.getByRole("link", { name: "Depósito" });
    expect(dep.getAttribute("href")).toBe("/deposito");
  });

  it("shows the plain insufficient text (no link) when the Depósito flag is off", () => {
    quoteMock.current.quote = makeQuote({ enoughBalance: false });
    flags.deposito = false;
    renderStep("USD");
    expect(screen.getByText("Saldo insuficiente para este valor. Ajuste o valor.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Depósito" })).toBeNull();
    expect((screen.getByRole("button", { name: /Continuar/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("relays Avenia's limit message in the error state", () => {
    quoteMock.current = {
      status: "error",
      quote: null,
      error: new ApiError(422, "o valor ultrapassa o limite disponível para esta conta.", "AVENIA_LIMIT"),
      refresh: () => {},
    };
    renderStep("USD");
    expect(
      screen.getByText("A Avenia informou: o valor ultrapassa o limite disponível para esta conta."),
    ).toBeTruthy();
  });

  it("shows the expired state with 'Atualizar cotação' and disables Continuar", () => {
    quoteMock.current.quote = makeQuote({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    renderStep("USD");
    expect(screen.getByRole("button", { name: "Atualizar cotação" })).toBeTruthy();
    expect((screen.getByRole("button", { name: /Continuar/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
