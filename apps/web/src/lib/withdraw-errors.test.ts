import { describe, it, expect } from "vitest";
import {
  mapWithdrawError,
  formatSupportCode,
  GENERIC_WITHDRAW_ERROR,
} from "./withdraw-errors";

describe("mapWithdrawError", () => {
  it("uses a fixed pt-BR message for a provider error, ignoring the raw backend body", () => {
    const leak = "upstream 502: provider timeout at gateway";
    const view = mapWithdrawError("WITHDRAW_PROVIDER_ERROR", leak, 502);
    expect(view).toEqual({
      message: "Não foi possível processar o saque agora. Tente novamente em instantes.",
      field: null,
    });
    // Never leaks the body and never flags a field for retry targeting.
    expect(view.message).not.toContain(leak);
  });

  it("maps the 412 (subaccount not provisioned) to a fixed pt-BR message", () => {
    const view = mapWithdrawError(undefined, "PRECONDITION_FAILED: subaccount missing", 412);
    expect(view.field).toBe(null);
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
    expect(view.supportCode).toBe("500-1432");
    expect(view.message).not.toContain("WithdrawService");

    expect(mapWithdrawError(undefined, leak, 500, now).message).toBe(GENERIC_WITHDRAW_ERROR);
    expect(mapWithdrawError(null, null, undefined, now).supportCode).toBe("ERR-1432");
  });

  // #92 removed Bravachain's own withdrawal limits, the own-CNPJ destination
  // check and the 24h destination hold — none of those codes can come back
  // from the backend anymore, so they fall through to the generic message.
  it("no longer special-cases the removed limit/hold/destination-CNPJ codes", () => {
    for (const code of [
      "WITHDRAW_LIMIT_PER_TX",
      "WITHDRAW_LIMIT_PER_DAY",
      "WITHDRAW_DESTINATION_NOT_OWN_CNPJ",
      "WITHDRAW_DESTINATION_ON_HOLD",
    ]) {
      const view = mapWithdrawError(code, "algum texto do backend", 422);
      expect(view.message).toBe(GENERIC_WITHDRAW_ERROR);
      expect(view.field).toBe(null);
    }
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
