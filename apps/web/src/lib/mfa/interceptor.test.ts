import { describe, it, expect } from "vitest";
import { shouldEnrollRedirect } from "./interceptor";

describe("shouldEnrollRedirect", () => {
  it("redirects on a 403 MFA_ENROLLMENT_REQUIRED from outside the wizard", () => {
    expect(shouldEnrollRedirect(403, "MFA_ENROLLMENT_REQUIRED", "/admin/clientes")).toBe(
      true,
    );
    expect(shouldEnrollRedirect(403, "MFA_ENROLLMENT_REQUIRED", "/")).toBe(true);
  });

  it("does not redirect when already inside the wizard (no loop)", () => {
    expect(
      shouldEnrollRedirect(403, "MFA_ENROLLMENT_REQUIRED", "/admin/seguranca/mfa"),
    ).toBe(false);
  });

  it("ignores other statuses/codes", () => {
    expect(shouldEnrollRedirect(403, "FORBIDDEN", "/admin")).toBe(false);
    expect(shouldEnrollRedirect(401, "MFA_ENROLLMENT_REQUIRED", "/admin")).toBe(false);
    expect(shouldEnrollRedirect(200, undefined, "/admin")).toBe(false);
  });
});
