import { describe, it, expect } from "vitest";
import { identityFromToken } from "./role";

/** Builds a JWT-shaped string whose payload decodes to `payload`. */
function token(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${body}.signature`;
}

describe("identityFromToken", () => {
  it("recognizes an ADMIN token", () => {
    expect(identityFromToken(token({ sub: "u1", role: "ADMIN" }))).toEqual({
      userId: "u1",
      isAdmin: true,
    });
  });

  it("denies a non-admin (USER) token", () => {
    expect(identityFromToken(token({ sub: "u2", role: "USER" }))).toEqual({
      userId: "u2",
      isAdmin: false,
    });
  });

  it("is case-insensitive on the role", () => {
    expect(identityFromToken(token({ sub: "u3", role: "admin" }))!.isAdmin).toBe(true);
  });

  it("returns null for no / malformed token", () => {
    expect(identityFromToken(null)).toBeNull();
    expect(identityFromToken(undefined)).toBeNull();
    expect(identityFromToken("not-a-jwt")).toBeNull();
  });

  it("treats a token without a role claim as non-admin", () => {
    expect(identityFromToken(token({ sub: "u4" }))!.isAdmin).toBe(false);
  });
});
