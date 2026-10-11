import { describe, it, expect } from "vitest";
import { mapWithdrawError, GENERIC_WITHDRAW_ERROR } from "./withdraw-errors";

describe("mapWithdrawError", () => {
  it("shows the backend message verbatim and highlights the PIX key for NOT_OWN_CNPJ (403)", () => {
    const msg = "A chave PIX informada não pertence ao CNPJ da empresa.";
    expect(mapWithdrawError("WITHDRAW_DESTINATION_NOT_OWN_CNPJ", msg)).toEqual({
      message: msg,
      field: "pixKey",
      hold: false,
    });
  });

  it("highlights the amount field for per-transaction limit (422)", () => {
    const msg = "Valor acima do limite por saque de R$ 5.000,00.";
    expect(mapWithdrawError("WITHDRAW_LIMIT_PER_TX", msg)).toEqual({
      message: msg,
      field: "amount",
      hold: false,
    });
  });

  it("highlights the amount field for daily limit (422)", () => {
    const msg = "Limite diário atingido. Disponível hoje: R$ 0,00.";
    expect(mapWithdrawError("WITHDRAW_LIMIT_PER_DAY", msg)).toEqual({
      message: msg,
      field: "amount",
      hold: false,
    });
  });

  it("sets the hold flag for a destination on hold (422)", () => {
    const msg = "Chave em validação por 24h. Liberação em 11/10/2026 14:00.";
    const view = mapWithdrawError("WITHDRAW_DESTINATION_ON_HOLD", msg);
    expect(view.hold).toBe(true);
    expect(view.message).toBe(msg);
    expect(view.field).toBe("pixKey");
  });

  it("falls back to a default message when the backend omits one for a known code", () => {
    expect(mapWithdrawError("WITHDRAW_DESTINATION_NOT_OWN_CNPJ", "").message).toBe(
      "A chave PIX precisa estar no CNPJ da sua empresa.",
    );
    expect(mapWithdrawError("WITHDRAW_LIMIT_PER_DAY", "   ").message).toBe(
      "Limite de saques do dia atingido.",
    );
  });

  it("uses a generic message (no backend detail) for unknown or missing codes", () => {
    const leak = "Internal error: NullPointer at WithdrawService.java:42";
    expect(mapWithdrawError("SOME_OTHER_CODE", leak)).toEqual({
      message: GENERIC_WITHDRAW_ERROR,
      field: null,
      hold: false,
    });
    expect(mapWithdrawError(undefined, leak).message).toBe(GENERIC_WITHDRAW_ERROR);
    expect(mapWithdrawError(null).message).toBe(GENERIC_WITHDRAW_ERROR);
  });
});
