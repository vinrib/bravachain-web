// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import type { BeneficiarySummary } from "@/lib/send/types";

let result: Promise<BeneficiarySummary[]>;
vi.mock("@/lib/send/api", () => ({
  getBeneficiaries: () => result,
}));

import { BeneficiaryStep } from "./beneficiary-step";

const LIST: BeneficiarySummary[] = [
  { id: "usd-1", currency: "USD", railLabel: "Wire", initials: "HC", name: "Harbor Coffee Imports LLC", line: "Lead Bank · conta ••••4821" },
  { id: "usd-2", currency: "USD", railLabel: "Wire", initials: "NP", name: "Northpoint Packaging Inc.", line: "JPMorgan Chase · conta ••••0937" },
];

const onSelect = vi.fn();
const onRegister = vi.fn();

function renderStep() {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <BeneficiaryStep currency="USD" onSelect={onSelect} onRegister={onRegister} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  result = Promise.resolve(LIST);
});
afterEach(() => {
  cleanup();
  onSelect.mockClear();
  onRegister.mockClear();
});

describe("BeneficiaryStep", () => {
  it("lists saved beneficiaries with their masked summary", async () => {
    renderStep();
    expect(await screen.findByText("Harbor Coffee Imports LLC")).toBeTruthy();
    expect(screen.getByText("Lead Bank · conta ••••4821")).toBeTruthy();
    expect(screen.getByText("Northpoint Packaging Inc.")).toBeTruthy();
  });

  it("filters by the search query", async () => {
    renderStep();
    await screen.findByText("Harbor Coffee Imports LLC");
    fireEvent.change(screen.getByLabelText("Buscar destinatários"), {
      target: { value: "northpoint" },
    });
    expect(screen.queryByText("Harbor Coffee Imports LLC")).toBeNull();
    expect(screen.getByText("Northpoint Packaging Inc.")).toBeTruthy();
  });

  it("calls onSelect with the chosen beneficiary", async () => {
    renderStep();
    const row = await screen.findByText("Harbor Coffee Imports LLC");
    row.closest("button")!.click();
    expect(onSelect).toHaveBeenCalledWith(LIST[0]);
  });

  it("calls onRegister from 'Cadastrar beneficiário'", async () => {
    renderStep();
    await screen.findByText("Harbor Coffee Imports LLC");
    screen.getByRole("button", { name: "Cadastrar beneficiário" }).click();
    expect(onRegister).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when there are no saved beneficiaries", async () => {
    result = Promise.resolve([]);
    renderStep();
    expect(await screen.findByText("Nenhum beneficiário em USD")).toBeTruthy();
  });

  it("shows a retry error state when the list fails to load", async () => {
    result = Promise.reject(new Error("network"));
    renderStep();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Tentar novamente/ })).toBeTruthy(),
    );
  });
});
