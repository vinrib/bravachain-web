// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import type { SendListItem, SendReceipt } from "@/lib/send/types";

const LIST: SendListItem[] = [
  { id: "snd-1", currency: "USD", beneficiaryName: "Harbor Coffee Imports LLC", amountBrl: 10000, receiveAmount: 1749.93, status: "concluido", createdAt: "04/11/2026" },
  { id: "snd-2", currency: "EUR", beneficiaryName: "Maison Verte SARL", amountBrl: 6420, receiveAmount: 960.06, status: "processando", createdAt: "04/11/2026" },
];
const RECEIPT: SendReceipt = {
  id: "snd-1", identifier: "AVN-20261104-SND-1", createdAt: "04/11/2026", currency: "USD",
  beneficiaryName: "Harbor Coffee Imports LLC", beneficiaryLine: "Lead Bank · conta ••••4821",
  lines: { sendAmount: 10000, aveniaFee: 48, railFee: 55.4, bravachainCommission: 202, receiveAmount: 1749.93 },
  referenceRate: 5.54, message: "INV-2026-0418", purposeCode: "12995", purposeName: "Compra ou venda de mercadoria", status: "concluido",
};

vi.mock("@/lib/send/api", () => ({
  getSends: () => Promise.resolve(LIST),
  getSendReceipt: () => Promise.resolve(RECEIPT),
}));
vi.mock("@/lib/hooks", () => ({ useMe: () => ({ data: { name: "Marcia Alves Comércio Ltda" } }) }));

import { SendsView } from "./sends-view";

function renderView() {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <SendsView />
    </NextIntlClientProvider>,
  );
}

afterEach(cleanup);

describe("SendsView", () => {
  it("lists sends with beneficiary and status", async () => {
    renderView();
    expect(await screen.findByText("Harbor Coffee Imports LLC")).toBeTruthy();
    expect(screen.getByText("Maison Verte SARL")).toBeTruthy();
    // Status badge for a completed send.
    expect(screen.getAllByText("Concluído").length).toBeGreaterThan(0);
  });

  it("opens the receipt (with the Avenia settlement text) on row click", async () => {
    renderView();
    const row = await screen.findByText("Harbor Coffee Imports LLC");
    fireEvent.click(row.closest("button")!);
    await waitFor(() => expect(screen.getByText("AVN-20261104-SND-1")).toBeTruthy());
    expect(screen.getByText("O pagamento é executado e liquidado pela Avenia.")).toBeTruthy();
    expect(screen.getByText("Pagamento executado pela Avenia.")).toBeTruthy();
    // No claim of legal validity.
    expect(screen.getByText("Documento informativo. Não constitui comprovante fiscal.")).toBeTruthy();
  });
});
