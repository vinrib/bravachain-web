// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import type { SendChannel } from "@/lib/send/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

let channelsResult: Promise<SendChannel[]>;
vi.mock("@/lib/send/api", () => ({
  getSendChannels: () => channelsResult,
}));

let kyc: { data: { status: string } | null; loading: boolean };
vi.mock("@/lib/hooks", () => ({
  useKycState: () => kyc,
}));

import { CurrencyChoice } from "./currency-choice";

function renderChoice() {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <CurrencyChoice />
    </NextIntlClientProvider>,
  );
}

const ALL_AVAILABLE: SendChannel[] = [
  { currency: "BRL", available: true, rail: "PIX" },
  { currency: "USD", available: true, rail: "WIRE" },
  { currency: "EUR", available: true, rail: "SEPA" },
];

beforeEach(() => {
  kyc = { data: { status: "approved" }, loading: false };
  channelsResult = Promise.resolve(ALL_AVAILABLE);
});

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("CurrencyChoice", () => {
  it("renders the three available currency cards, all selectable", async () => {
    renderChoice();
    const brl = await screen.findByRole("button", { name: /Enviar em BRL/ });
    const usd = screen.getByRole("button", { name: /Enviar em USD/ });
    const eur = screen.getByRole("button", { name: /Enviar em EUR/ });
    expect((brl as HTMLButtonElement).disabled).toBe(false);
    expect((usd as HTMLButtonElement).disabled).toBe(false);
    expect((eur as HTMLButtonElement).disabled).toBe(false);
  });

  it("navigates to the per-currency route when a card is clicked", async () => {
    renderChoice();
    const usd = await screen.findByRole("button", { name: /Enviar em USD/ });
    usd.click();
    expect(push).toHaveBeenCalledWith("/enviar/usd");
  });

  it("greys out an unavailable channel with the Avenia-enablement label and blocks it", async () => {
    channelsResult = Promise.resolve([
      { currency: "BRL", available: true, rail: "PIX" },
      { currency: "USD", available: false, rail: "WIRE" },
      { currency: "EUR", available: true, rail: "SEPA" },
    ]);
    renderChoice();
    const usd = await screen.findByRole("button", { name: /Enviar em USD/ });
    expect((usd as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Habilitação feita pela Avenia")).toBeTruthy();
    usd.click();
    expect(push).not.toHaveBeenCalled();
  });

  it("treats a currency missing from the response as unavailable (not shown as available)", async () => {
    channelsResult = Promise.resolve([
      { currency: "BRL", available: true, rail: "PIX" },
      { currency: "USD", available: true, rail: "WIRE" },
      // EUR omitted entirely by the API.
    ]);
    renderChoice();
    const eur = await screen.findByRole("button", { name: /Enviar em EUR/ });
    expect((eur as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Habilitação feita pela Avenia")).toBeTruthy();
  });

  it("with verification pending, shows the notice and disables every card", async () => {
    kyc = { data: { status: "pending" }, loading: false };
    renderChoice();
    const usd = await screen.findByRole("button", { name: /Enviar em USD/ });
    expect(
      screen.getByText("Conclua a verificação de identidade para enviar."),
    ).toBeTruthy();
    for (const cur of ["BRL", "USD", "EUR"]) {
      const card = screen.getByRole("button", { name: new RegExp(`Enviar em ${cur}`) });
      expect((card as HTMLButtonElement).disabled).toBe(true);
    }
    usd.click();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows a retry error state when channels fail to load", async () => {
    channelsResult = Promise.reject(new Error("network"));
    renderChoice();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Tentar novamente/ })).toBeTruthy(),
    );
  });
});
