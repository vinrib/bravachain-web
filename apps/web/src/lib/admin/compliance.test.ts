import { describe, it, expect } from "vitest";
import { endpoints } from "@bravachain/api-client";
import * as compliance from "./compliance";

/**
 * Bravachain does not approve, reject, or limit clients or operations (#92) —
 * only Avenia decides. These assert the dead decision/exception routes and
 * helpers never come back, so no BFF call to them can be reintroduced here.
 */
describe("admin compliance module — no decision/exception routes", () => {
  it("exports no decide() or setGrandfathered() helper", () => {
    expect("decide" in compliance).toBe(false);
    expect("setGrandfathered" in compliance).toBe(false);
  });

  it("has no complianceDecision or complianceGrandfathered endpoint", () => {
    expect("complianceDecision" in endpoints.admin).toBe(false);
    expect("complianceGrandfathered" in endpoints.admin).toBe(false);
  });
});
