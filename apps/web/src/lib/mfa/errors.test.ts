import { describe, it, expect } from "vitest";
import {
  mapMfaVerifyError,
  extractRetryAfterSeconds,
  formatLockWait,
} from "./errors";

describe("mapMfaVerifyError", () => {
  it("classifies an expired/consumed challenge as expired", () => {
    expect(mapMfaVerifyError({ status: 401, code: "MFA_TOKEN_EXPIRED" }).kind).toBe(
      "expired",
    );
    expect(mapMfaVerifyError({ status: 400, code: "CHALLENGE_NOT_FOUND" }).kind).toBe(
      "expired",
    );
  });

  it("classifies lockouts and surfaces the wait time", () => {
    const locked = mapMfaVerifyError({
      status: 423,
      code: "ACCOUNT_LOCKED",
      body: { retryAfterSeconds: 300 },
    });
    expect(locked.kind).toBe("locked");
    expect(locked.retryAfterSeconds).toBe(300);

    expect(mapMfaVerifyError({ status: 429, code: "TOO_MANY_ATTEMPTS" }).kind).toBe(
      "locked",
    );
  });

  it("classifies a wrong code/recovery code as invalid (never revealing which)", () => {
    expect(mapMfaVerifyError({ status: 401, code: "INVALID_CODE" }).kind).toBe(
      "invalid",
    );
    expect(mapMfaVerifyError({ status: 400, code: null }).kind).toBe("invalid");
  });

  it("falls back to generic for unexpected failures", () => {
    expect(mapMfaVerifyError({ status: 500, code: null }).kind).toBe("generic");
  });
});

describe("extractRetryAfterSeconds", () => {
  it("reads a numeric Retry-After header", () => {
    expect(extractRetryAfterSeconds({ retryAfterHeader: "120" })).toBe(120);
  });

  it("reads an HTTP-date Retry-After header", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const later = new Date("2026-01-01T00:02:00Z").toUTCString();
    expect(extractRetryAfterSeconds({ retryAfterHeader: later }, now)).toBe(120);
  });

  it("reads plausible body fields and an absolute unlock timestamp", () => {
    expect(extractRetryAfterSeconds({ body: { retryAfter: 90 } })).toBe(90);
    expect(extractRetryAfterSeconds({ body: { lockedForSeconds: "45" } })).toBe(45);
    const now = new Date("2026-01-01T00:00:00Z");
    expect(
      extractRetryAfterSeconds(
        { body: { lockedUntil: "2026-01-01T00:05:00Z" } },
        now,
      ),
    ).toBe(300);
  });

  it("returns undefined when nothing usable is present", () => {
    expect(extractRetryAfterSeconds({ body: {} })).toBeUndefined();
    expect(extractRetryAfterSeconds({ retryAfterHeader: "0" })).toBeUndefined();
  });
});

describe("formatLockWait", () => {
  it("formats seconds, minutes and hours", () => {
    expect(formatLockWait(45)).toBe("45 s");
    expect(formatLockWait(300)).toBe("5 min");
    expect(formatLockWait(3600)).toBe("1 h");
    expect(formatLockWait(3720)).toBe("1 h 2 min");
  });

  it("returns null for empty/zero", () => {
    expect(formatLockWait(undefined)).toBeNull();
    expect(formatLockWait(0)).toBeNull();
  });
});
