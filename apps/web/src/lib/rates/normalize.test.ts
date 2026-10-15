import { describe, it, expect } from "vitest";
import {
  normalizeLive,
  normalizeHistory,
  normalizeConvert,
  normalizeAlerts,
} from "./normalize";

describe("normalizeLive", () => {
  it("parses the real { USD_BRL, EUR_BRL } shape (rate as string)", () => {
    const out = normalizeLive({
      USD_BRL: {
        pair: "USD_BRL",
        rate: "5.4210",
        change24h: 0.35,
        changeDirection: "up",
        isFallback: false,
        updatedAt: "2026-10-15T12:00:00Z",
        source: "awesomeapi",
        isIndicative: true,
      },
      EUR_BRL: {
        pair: "EUR_BRL",
        rate: "5.8900",
        change24h: -0.2,
        changeDirection: "down",
        isFallback: true,
        updatedAt: "2026-10-15T12:00:00Z",
        source: "static",
        isIndicative: true,
      },
    });
    expect(out.USD_BRL?.rate).toBe(5.421);
    expect(out.USD_BRL?.changeDirection).toBe("up");
    expect(out.USD_BRL?.source).toBe("awesomeapi");
    expect(out.USD_BRL?.isIndicative).toBe(true);
    expect(out.EUR_BRL?.isFallback).toBe(true);
    expect(out.EUR_BRL?.source).toBe("static");
  });

  it("returns null for a missing pair", () => {
    expect(normalizeLive({ USD_BRL: { pair: "USD_BRL", rate: "5" } }).EUR_BRL).toBeNull();
  });
});

describe("normalizeHistory", () => {
  it("parses dataPoints (rate as string) and stats", () => {
    const out = normalizeHistory({
      pair: "USD_BRL",
      period: "1M",
      dataPoints: [
        { timestamp: "2026-09-15T00:00:00Z", rate: "5.10" },
        { timestamp: "2026-10-15T00:00:00Z", rate: "5.42" },
      ],
      stats: { min: "5.10", max: "5.42", open: "5.15", avg: "5.26" },
    });
    expect(out.points).toHaveLength(2);
    expect(out.points[1]!.rate).toBe(5.42);
    expect(out.stats.min).toBe(5.1);
    expect(out.stats.open).toBe(5.15);
    expect(out.empty).toBe(false);
  });

  it("treats all-zero stats with no points as empty", () => {
    const out = normalizeHistory({
      pair: "EUR_BRL",
      period: "1D",
      dataPoints: [],
      stats: { min: "0", max: "0", open: "0", avg: "0" },
    });
    expect(out.empty).toBe(true);
    expect(out.points).toEqual([]);
  });
});

describe("normalizeConvert", () => {
  it("parses inputAmount/outputAmount/rate strings", () => {
    const out = normalizeConvert({
      inputAmount: "1000.00",
      inputCurrency: "USD",
      outputAmount: "5421.00",
      outputCurrency: "BRL",
      rate: "5.4210",
      updatedAt: "2026-10-15T12:00:00Z",
    });
    expect(out.inputAmount).toBe(1000);
    expect(out.outputAmount).toBe(5421);
    expect(out.rate).toBe(5.421);
    expect(out.outputCurrency).toBe("BRL");
  });
});

describe("normalizeAlerts", () => {
  it("parses the list (targetRate string, distance %, direction)", () => {
    const out = normalizeAlerts([
      {
        id: "a1",
        userId: "u1",
        pair: "USD_BRL",
        condition: "ABOVE_OR_EQUAL",
        targetRate: "5.5000",
        channels: ["EMAIL"],
        status: "ACTIVE",
        triggerCount: 0,
        lastTriggeredAt: null,
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-01T00:00:00Z",
        distance: 1.44,
        distanceDirection: "below",
      },
    ]);
    expect(out).toHaveLength(1);
    const a = out[0]!;
    expect(a.targetRate).toBe(5.5);
    expect(a.condition).toBe("ABOVE_OR_EQUAL");
    expect(a.channels).toEqual(["EMAIL"]);
    expect(a.distance).toBe(1.44);
    expect(a.distanceDirection).toBe("below");
  });

  it("keeps only known channels and defaults to EMAIL", () => {
    expect(normalizeAlerts([{ id: "x", channels: [] }])[0]!.channels).toEqual(["EMAIL"]);
    expect(
      normalizeAlerts([{ id: "y", channels: ["EMAIL", "WHATSAPP", "PUSH"] }])[0]!.channels,
    ).toEqual(["EMAIL", "WHATSAPP", "PUSH"]);
  });

  it("is safe on empty input", () => {
    expect(normalizeAlerts(null)).toEqual([]);
  });
});
