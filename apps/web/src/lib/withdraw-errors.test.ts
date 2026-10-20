import { describe, it, expect } from "vitest";
import {
  mapWithdrawError,
  formatSupportCode,
  GENERIC_WITHDRAW_ERROR,
} from "./withdraw-errors";

describe("mapWithdrawError", () => {
  it("shows the backend message verbatim and highlights the PIX key for NOT_OWN_CNPJ (403)", () => {
    const msg = "A chave PIX informada não pertence ao CNPJ da empresa.";
    expect(mapWithdrawError("WITHDRAW_DESTINATION_NOT_OWN_CNPJ", msg, 403)).toEqual({
      message: msg,
      field: "pixKey",
      hold: false,
    });
  });

  it("highlights the amount field for per-transaction limit (422)", () => {
    const msg = "Valor acima do limite por saque de R$ 5.000,00.";
    expect(mapWithdrawError("WITHDRAW_LIMIT_PER_TX", msg, 422)).toEqual({
      message: msg,
      field: "amount",
      hold: false,
    });
  });

  it("highlights the amount field for daily limit (422)", () => {
    const msg = "Limite diário atingido. Disponível hoje: R$ 0,00.";
    expect(mapWithdrawError("WITHDRAW_LIMIT_PER_DAY", msg, 422)).toEqual({
      message: msg,
      field: "amount",
      hold: false,
    });
  });

  it("sets the hold flag for a destination on hold (422)", () => {
    const msg = "Chave em validação por 24h. Liberação em 11/10/2026 14:00.";
    const view = mapWithdrawError("WITHDRAW_DESTINATION_ON_HOLD", msg, 422);
    expect(view.hold).toBe(true);
    expect(view.message).toBe(msg);
    expect(view.field).toBe("pixKey");
  });

  it("falls back to a default message when the backend omits one for a known code", () => {
    expect(mapWithdrawError("WITHDRAW_DESTINATION_NOT_OWN_CNPJ", "", 403).message).toBe(
      "A chave PIX precisa estar no CNPJ da sua empresa.",
    );
    expect(mapWithdrawError("WITHDRAW_LIMIT_PER_DAY", "   ", 422).message).toBe(
      "Limite de saques do dia atingido.",
    );
  });

  it("uses a fixed pt-BR message for a provider error, ignoring the raw backend body", () => {
    const leak = "upstream 502: provider timeout at gateway";
    const view = mapWithdrawError("WITHDRAW_PROVIDER_ERROR", leak, 502);
    expect(view).toEqual({
      message: "Não foi possível processar o saque agora. Tente novamente em instantes.",
      field: null,
      hold: false,
    });
    // Never leaks the body and never flags a field for retry targeting.
    expect(view.message).not.toContain(leak);
  });

  it("maps the 412 (subaccount not provisioned) to a fixed pt-BR message", () => {
    const view = mapWithdrawError(undefined, "PRECONDITION_FAILED: subaccount missing", 412);
    expect(view.field).toBe(null);
    expect(view.hold).toBe(false);
    expect(view.message).toBe(
      "Sua subconta de pagamentos ainda está sendo preparada. Tente novamente em instantes.",
    );
    expect(view.supportCode).toBeUndefined();
  });

  it("uses a generic message plus a short support code for unknown/missing codes", () => {
    const leak = "Internal error: NullPointer at WithdrawService.java:42";
    const now = new Date(2026, 9, 16, 14, 32);
    const view = mapWithdrawError("SOME_OTHER_CODE", leak, 500, now);
    expect(view.message).toBe(GENERIC_WITHDRAW_ERROR);
    expect(view.field).toBe(null);
    expect(view.hold).toBe(false);
    expect(view.supportCode).toBe("500-1432");
    expect(view.message).not.toContain("WithdrawService");

    expect(mapWithdrawError(undefined, leak, 500, now).message).toBe(GENERIC_WITHDRAW_ERROR);
    expect(mapWithdrawError(null, null, undefined, now).supportCode).toBe("ERR-1432");
  });
});

describe("formatSupportCode", () => {
  it("combines status and zero-padded local time", () => {
    expect(formatSupportCode(500, new Date(2026, 9, 16, 9, 5))).toBe("500-0905");
    expect(formatSupportCode(503, new Date(2026, 9, 16, 23, 59))).toBe("503-2359");
  });

  it("uses ERR when the status is missing or invalid", () => {
    expect(formatSupportCode(undefined, new Date(2026, 9, 16, 0, 0))).toBe("ERR-0000");
    expect(formatSupportCode(0, new Date(2026, 9, 16, 1, 2))).toBe("ERR-0102");
  });
});
