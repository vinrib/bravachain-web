// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import type {
  BeneficiarySummary,
  SendCurrency,
  SendDetails,
  SendQuote,
} from "@/lib/send/types";

const createSend = vi.hoisted(() => vi.fn());
vi.mock("@/lib/send/api", () => ({ createSend }));
vi.mock("@/lib/hooks", () => ({
  useMe: () => ({ data: { name: "Marcia Alves Comércio Ltda" } }),
}));

import { ReviewStep } from "./review-step";

const BEN: BeneficiarySummary = {
  id: "usd-1", currency: "USD", railLabel: "Wire", initials: "HC",
  name: "Harbor Coffee Imports LLC", line: "Lead Bank · conta ••••4821",
};
const DETAILS: SendDetails = {
  message: "INV-2026-0418", purposeCode: "12995",
  purposeName: "Compra ou venda de mercadoria", invoiceAttached: false,
};
function quote(over: Partial<SendQuote> = {}): SendQuote {
  return {
    quoteId: "q1",
    lines: { sendAmount: 10000, aveniaFee: 48, railFee: 55.4, bravachainCommission: 202, receiveAmount: 1749.93 },
    referenceRate: 5.54,
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    isEstimate: true, balanceBrl: 248315.4, enoughBalance: true, invoiceRequired: false, messageApplied: true,
    ...over,
  };
}

const onConfirmed = vi.fn();
function renderStep(q: SendQuote = quote(), currency: SendCurrency = "USD") {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <ReviewStep currency={currency} beneficiary={BEN} quote={q} details={DETAILS} onConfirmed={onConfirmed} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => createSend.mockReset());
afterEach(() => {
  cleanup();
  onConfirmed.mockClear();
});

describe("ReviewStep", () => {
  it("shows the summary, the Avenia settlement notice and Confirmar envio", () => {
    createSend.mockResolvedValue({ id: "snd_1", status: "processando" });
    renderStep();
    expect(screen.getByText("Harbor Coffee Imports LLC")).toBeTruthy();
    expect(screen.getByText("O pagamento é executado e liquidado pela Avenia.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirmar envio" })).toBeTruthy();
  });

  it("does not render a 0-value commission line", () => {
    createSend.mockResolvedValue({ id: "snd_1", status: "processando" });
    renderStep(quote({
      lines: { sendAmount: 10000, aveniaFee: 48, railFee: 55.4, bravachainCommission: 0, receiveAmount: 1749.93 },
    }));
    expect(screen.queryByText("Comissão Bravachain")).toBeNull();
  });

  it("protects against a double-click (one send is created)", async () => {
    createSend.mockResolvedValue({ id: "snd_1", status: "processando" });
    renderStep();
    const btn = screen.getByRole("button", { name: "Confirmar envio" });
    // Two synchronous clicks before React re-renders the disabled button.
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(createSend).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
  });

  it("reuses the same Idempotency-Key on retry after a failure", async () => {
    createSend
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ id: "snd_2", status: "processando" });
    renderStep();
    const btn = screen.getByRole("button", { name: "Confirmar envio" });
    fireEvent.click(btn);
    await waitFor(() => expect(createSend).toHaveBeenCalledTimes(1));
    // After the failure the button re-enables; retry.
    await waitFor(() => expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar envio" }));
    await waitFor(() => expect(onConfirmed).toHaveBeenCalled());
    const key1 = createSend.mock.calls[0]![1];
    const key2 = createSend.mock.calls[1]![1];
    expect(key1).toBe(key2);
  });

  it("disables Confirmar when the quote has expired", () => {
    createSend.mockResolvedValue({ id: "snd_1", status: "processando" });
    renderStep(quote({ expiresAt: new Date(Date.now() - 1000).toISOString() }));
    const btn = screen.getByRole("button", { name: "Confirmar envio" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(btn);
    expect(createSend).not.toHaveBeenCalled();
  });
});
