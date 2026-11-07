// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import type { BeneficiarySummary } from "@/lib/send/types";

const SAVED: BeneficiarySummary = {
  id: "brl-new", currency: "BRL", railLabel: "Pix", initials: "TL",
  name: "Transportes Litoral Ltda", line: "Pix · financeiro@litoral",
};
const createBeneficiary = vi.hoisted(() => vi.fn());
vi.mock("@/lib/send/api", () => ({ createBeneficiary }));

import { BeneficiaryForm } from "./beneficiary-form";

const onSaved = vi.fn();

function renderForm(currency: "BRL" | "USD" | "EUR" = "BRL") {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <BeneficiaryForm currency={currency} onSaved={onSaved} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  createBeneficiary.mockResolvedValue(SAVED);
});
afterEach(() => {
  cleanup();
  createBeneficiary.mockReset();
  onSaved.mockClear();
});

describe("BeneficiaryForm", () => {
  it("shows the BRL Pix form with a Pix/Conta tab switch", () => {
    renderForm("BRL");
    expect(screen.getByText("Beneficiário Pix")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Pix" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Conta bancária" })).toBeTruthy();
  });

  it("switches to the bank-account form", () => {
    renderForm("BRL");
    fireEvent.click(screen.getByRole("tab", { name: "Conta bancária" }));
    expect(screen.getByText("Conta bancária no Brasil")).toBeTruthy();
  });

  it("blocks save and shows the error summary when required fields are empty", () => {
    renderForm("BRL");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByText("Revise os campos destacados para salvar.")).toBeTruthy();
    expect(createBeneficiary).not.toHaveBeenCalled();
  });

  it("saves a valid Pix beneficiary and returns the masked summary", async () => {
    renderForm("BRL");
    fireEvent.change(screen.getByLabelText(/Nome ou razão social/), {
      target: { value: "Transportes Litoral Ltda" },
    });
    // Default key type is CPF/CNPJ → provide a valid CPF.
    fireEvent.change(screen.getByLabelText(/Chave Pix/), {
      target: { value: "12345678901" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(SAVED));
    expect(createBeneficiary).toHaveBeenCalledTimes(1);
  });

  it("relays Avenia's message when saving is rejected", async () => {
    createBeneficiary.mockRejectedValueOnce(new Error("os dados do beneficiário não conferem"));
    renderForm("BRL");
    fireEvent.change(screen.getByLabelText(/Nome ou razão social/), {
      target: { value: "Transportes Litoral Ltda" },
    });
    fireEvent.change(screen.getByLabelText(/Chave Pix/), { target: { value: "12345678901" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() =>
      expect(
        screen.getByText("A Avenia informou: os dados do beneficiário não conferem"),
      ).toBeTruthy(),
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("masks a CPF/CNPJ field as the user types (USD not needed here)", () => {
    renderForm("BRL");
    fireEvent.click(screen.getByRole("tab", { name: "Conta bancária" }));
    const doc = screen.getByLabelText(/CPF ou CNPJ/) as HTMLInputElement;
    fireEvent.change(doc, { target: { value: "12345678000190" } });
    expect(doc.value).toBe("12.345.678/0001-90");
  });
});
