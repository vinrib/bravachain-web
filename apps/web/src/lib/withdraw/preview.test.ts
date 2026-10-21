import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the BFF client so we can assert the request and feed raw responses.
vi.mock("@/lib/client-api", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/lib/client-api";
import { getWithdrawPreview } from "./preview";

const mockFetch = vi.mocked(apiFetch);

describe("getWithdrawPreview", () => {
  beforeEach(() => mockFetch.mockReset());

  it("posts amountBrla alone when no pixKeyType is given", async () => {
    mockFetch.mockResolvedValue({});
    await getWithdrawPreview(10);
    const [path, init] = mockFetch.mock.calls[0]!;
    expect(path).toBe("/v1/withdraw/pix/preview");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init!.body as string)).toEqual({ amountBrla: 10 });
  });

  it("includes pixKeyType when provided", async () => {
    mockFetch.mockResolvedValue({});
    await getWithdrawPreview(10, "EMAIL");
    const [, init] = mockFetch.mock.calls[0]!;
    expect(JSON.parse(init!.body as string)).toEqual({
      amountBrla: 10,
      pixKeyType: "EMAIL",
    });
  });

  it("keeps money decimals as strings and defaults currency to BRL", async () => {
    mockFetch.mockResolvedValue({
      amountBrla: 10,
      feeBrl: 0.1,
      netAmountBrl: "9.90",
    });
    const p = await getWithdrawPreview(10);
    expect(p).toEqual({
      amountBrla: "10",
      feeBrl: "0.1",
      netAmountBrl: "9.90",
      currency: "BRL",
    });
  });

  it("maps missing/invalid money fields to null without inventing values", async () => {
    mockFetch.mockResolvedValue({ currency: "BRL" });
    const p = await getWithdrawPreview(10);
    expect(p).toEqual({
      amountBrla: null,
      feeBrl: null,
      netAmountBrl: null,
      currency: "BRL",
    });
  });
});
