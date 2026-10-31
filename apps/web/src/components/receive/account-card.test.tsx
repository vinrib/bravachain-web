// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import { AccountCard } from "./account-card";
import type { DedicatedAccount } from "@/lib/receive/types";

function renderCard(account: DedicatedAccount) {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      <AccountCard account={account} />
    </NextIntlClientProvider>,
  );
}

afterEach(cleanup);

describe("AccountCard", () => {
  it("USD account with the new fields renders them in order, with accountType translated", () => {
    const usd: DedicatedAccount = {
      currency: "USD",
      beneficiaryName: "ACME LTDA",
      bankName: "Modulus Bank",
      bankAddress: "123 Main St, New York, NY 10001, USA",
      accountNumber: "3123456789",
      routingNumber: "026073150",
      accountType: "CHECKING",
      paymentRail: "ACH / Wire",
    };
    renderCard(usd);

    const labels = screen.getAllByText(
      /Titular|Banco|Endereço do banco|Número da conta|Routing \(ABA\)|Tipo de conta|Tipo de transferência/,
    );
    expect(labels.map((el) => el.textContent)).toEqual([
      "Titular",
      "Banco",
      "Endereço do banco",
      "Número da conta",
      "Routing (ABA)",
      "Tipo de conta",
      "Tipo de transferência",
    ]);
    expect(screen.getByText("Corrente")).toBeTruthy();
    expect(screen.getByText("ACH / Wire")).toBeTruthy();
    expect(screen.getByText("123 Main St, New York, NY 10001, USA")).toBeTruthy();
  });

  it("EUR account renders beneficiaryAddress right after the beneficiary name", () => {
    const eur: DedicatedAccount = {
      currency: "EUR",
      beneficiaryName: "ACME LTDA",
      beneficiaryAddress: "Av. Paulista, 1000, São Paulo, SP, Brasil",
      bankName: "Modulus Bank EU",
      iban: "DE00 0000",
      swift: "XYZ",
    };
    renderCard(eur);

    const labels = screen.getAllByText(/Titular|Endereço do beneficiário|Banco|IBAN|SWIFT\/BIC/);
    expect(labels.map((el) => el.textContent)).toEqual([
      "Titular",
      "Endereço do beneficiário",
      "Banco",
      "IBAN",
      "SWIFT/BIC",
    ]);
  });

  it("account without the new fields shows no extra lines and no 'undefined'", () => {
    const usd: DedicatedAccount = {
      currency: "USD",
      beneficiaryName: "ACME LTDA",
      bankName: "Modulus Bank",
      accountNumber: "3123456789",
      routingNumber: "026073150",
    };
    renderCard(usd);

    expect(screen.queryByText("Endereço do banco")).toBeNull();
    expect(screen.queryByText("Tipo de conta")).toBeNull();
    expect(screen.queryByText("Tipo de transferência")).toBeNull();
    expect(screen.queryByText(/undefined/i)).toBeNull();
  });

  it("an unknown accountType value is shown as-is", () => {
    renderCard({ currency: "USD", accountType: "JOINT" });
    expect(screen.getByText("JOINT")).toBeTruthy();
  });

  it("'Copiar todos' includes the new fields in the clipboard text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderCard({
      currency: "USD",
      beneficiaryName: "ACME LTDA",
      bankAddress: "123 Main St, New York, NY 10001, USA",
      accountType: "SAVINGS",
      paymentRail: "ACH / Wire",
    });

    fireEvent.click(screen.getByRole("button", { name: /Copiar todos/i }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("Endereço do banco: 123 Main St, New York, NY 10001, USA"),
    );
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Tipo de conta: Poupança"));
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("Tipo de transferência: ACH / Wire"),
    );
  });

  it("wraps a long bank address instead of truncating it (narrow-width overflow guard)", () => {
    const { container } = renderCard({
      currency: "USD",
      bankAddress:
        "1234 Very Long Street Name, Suite 5678, New York City, NY 10001-0000, United States of America",
    });
    const valueEl = within(container).getByText(/Very Long Street Name/);
    expect(valueEl.className).toContain("whitespace-normal");
    expect(valueEl.className).toContain("break-words");
    expect(valueEl.className).not.toContain("truncate");
  });
});
