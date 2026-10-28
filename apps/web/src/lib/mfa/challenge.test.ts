import { describe, it, expect } from "vitest";
import { isMfaChallenge, extractMfaChallenge } from "./challenge";

describe("isMfaChallenge", () => {
  it("detects the canonical challenge shape", () => {
    expect(isMfaChallenge({ mfaRequired: true, mfaToken: "t" })).toBe(true);
  });

  it("detects a snake_case / enveloped challenge", () => {
    expect(isMfaChallenge({ mfa_required: true, mfa_token: "t" })).toBe(true);
    expect(isMfaChallenge({ data: { mfaRequired: true, mfaToken: "t" } })).toBe(true);
  });

  it("is false for a normal token-pair response", () => {
    expect(isMfaChallenge({ accessToken: "a", refreshToken: "r" })).toBe(false);
    expect(isMfaChallenge({ mfaRequired: false })).toBe(false);
    expect(isMfaChallenge(null)).toBe(false);
    expect(isMfaChallenge("nope")).toBe(false);
  });
});

describe("extractMfaChallenge", () => {
  it("pulls the token from the canonical shape", () => {
    expect(extractMfaChallenge({ mfaRequired: true, mfaToken: "abc" })).toEqual({
      mfaToken: "abc",
    });
  });

  it("reads plausible aliases and envelopes", () => {
    expect(extractMfaChallenge({ mfa_required: true, mfa_token: "x" })).toEqual({
      mfaToken: "x",
    });
    expect(
      extractMfaChallenge({ mfaRequired: true, challengeToken: "y" }),
    ).toEqual({ mfaToken: "y" });
    expect(
      extractMfaChallenge({ data: { mfaRequired: true, mfaToken: "z" } }),
    ).toEqual({ mfaToken: "z" });
  });

  it("returns null when it is not a challenge or the token is missing", () => {
    expect(extractMfaChallenge({ accessToken: "a", refreshToken: "r" })).toBeNull();
    expect(extractMfaChallenge({ mfaRequired: true })).toBeNull();
    expect(extractMfaChallenge(null)).toBeNull();
  });
});
