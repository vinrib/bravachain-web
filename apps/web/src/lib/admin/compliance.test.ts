import { describe, it, expect, vi, beforeEach } from "vitest";
import { endpoints } from "@bravachain/api-client";
import * as compliance from "./compliance";

vi.mock("@/lib/client-api", () => ({ apiFetch: vi.fn() }));
import { apiFetch } from "@/lib/client-api";

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

/**
 * `reviewStatus`/`review.status` are not approvals (confirmed by the API: no
 * guard reads them) — the web must never filter or render on them, and must
 * not break whether or not the API keeps sending them (#93).
 */
describe("admin compliance module — reviewStatus is not an approval (#93)", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it("listClients never sends reviewStatus as a query param", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
    await compliance.listClients({ q: "acme", risk: "HIGH", page: 1, pageSize: 20 });
    const [url] = vi.mocked(apiFetch).mock.calls[0]!;
    expect(String(url)).not.toContain("reviewStatus");
  });

  it("normalizeDetail works whether or not the API sends review.status", () => {
    const withStatus = compliance.normalizeDetail({
      userId: "u1",
      review: { status: "APPROVED", riskLevel: "LOW" },
    });
    expect(withStatus.review?.status).toBe("APPROVED");

    const withoutStatus = compliance.normalizeDetail({
      userId: "u1",
      review: { riskLevel: "LOW" },
    });
    expect(withoutStatus.review?.status).toBeUndefined();
  });
});
