import { describe, it, expect } from "vitest";
import { mapMfaVerifyError } from "./errors";

describe("mapMfaVerifyError", () => {
  it("treats any 4xx verify failure as a single neutral 'invalid'", () => {
    // The backend returns one opaque 401 for bad/expired/reused/locked factors.
    expect(mapMfaVerifyError({ status: 401, code: null }).kind).toBe("invalid");
    expect(mapMfaVerifyError({ status: 400, code: null }).kind).toBe("invalid");
    expect(mapMfaVerifyError({ status: 429, code: null }).kind).toBe("invalid");
  });

  it("falls back to generic for 5xx / transport failures", () => {
    expect(mapMfaVerifyError({ status: 500, code: null }).kind).toBe("generic");
    expect(mapMfaVerifyError({ status: 0, code: null }).kind).toBe("generic");
  });
});
