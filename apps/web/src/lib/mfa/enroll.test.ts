import { describe, it, expect } from "vitest";
import {
  normalizeEnrollStart,
  normalizeEnrollConfirm,
  formatSecretForDisplay,
} from "./enroll";

describe("normalizeEnrollStart", () => {
  it("reads the canonical fields", () => {
    expect(
      normalizeEnrollStart({
        otpauthUri: "otpauth://totp/x",
        qrDataUrl: "data:image/png;base64,AAA",
        secret: "ABCDEF",
      }),
    ).toEqual({
      otpauthUri: "otpauth://totp/x",
      qrDataUrl: "data:image/png;base64,AAA",
      secret: "ABCDEF",
    });
  });

  it("tolerates aliases and envelopes, null when absent", () => {
    expect(
      normalizeEnrollStart({ data: { qrCode: "data:...", manualKey: "KEY" } }),
    ).toEqual({ otpauthUri: null, qrDataUrl: "data:...", secret: "KEY" });
    expect(normalizeEnrollStart(null)).toEqual({
      otpauthUri: null,
      qrDataUrl: null,
      secret: null,
    });
  });
});

describe("normalizeEnrollConfirm", () => {
  it("reads recovery codes and aliases", () => {
    expect(normalizeEnrollConfirm({ recoveryCodes: ["a", "b"] })).toEqual({
      recoveryCodes: ["a", "b"],
    });
    expect(normalizeEnrollConfirm({ data: { backupCodes: ["c"] } })).toEqual({
      recoveryCodes: ["c"],
    });
  });

  it("drops non-strings and defaults to empty", () => {
    expect(
      normalizeEnrollConfirm({ recoveryCodes: ["a", 1, "", null] }).recoveryCodes,
    ).toEqual(["a"]);
    expect(normalizeEnrollConfirm({}).recoveryCodes).toEqual([]);
  });
});

describe("formatSecretForDisplay", () => {
  it("groups into 4-char chunks", () => {
    expect(formatSecretForDisplay("ABCDEFGH")).toBe("ABCD EFGH");
    expect(formatSecretForDisplay("ABCDE")).toBe("ABCD E");
  });

  it("returns null for empty", () => {
    expect(formatSecretForDisplay(null)).toBeNull();
  });
});
