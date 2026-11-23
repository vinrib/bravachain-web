import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/client-api";
import {
  isPtaxFeatureDisabledError,
  mapPtaxErrorToMessage,
} from "./api";
import { PTAX_COPY } from "./copy";
import {
  PtaxValidationError,
  parsePtaxConvertResponse,
  parsePtaxHistoryResponse,
  parsePtaxLatestResponse,
  parsePtaxMonthlyAverageResponse,
} from "./validate";

import latestFixture from "./__fixtures__/latest.json";
import usd1DFixture from "./__fixtures__/history-USD-1D.json";
import usd1WFixture from "./__fixtures__/history-USD-1W.json";
import usd1MFixture from "./__fixtures__/history-USD-1M.json";
import usd3MFixture from "./__fixtures__/history-USD-3M.json";
import usd1YFixture from "./__fixtures__/history-USD-1Y.json";
import eur1DFixture from "./__fixtures__/history-EUR-1D.json";
import eur1WFixture from "./__fixtures__/history-EUR-1W.json";
import eur1MFixture from "./__fixtures__/history-EUR-1M.json";
import eur3MFixture from "./__fixtures__/history-EUR-3M.json";
import eur1YFixture from "./__fixtures__/history-EUR-1Y.json";
import usd0423Fixture from "./__fixtures__/history-USD-1D-2025-04-23.json";
import monthlyUsdFixture from "./__fixtures__/monthly-average-USD.json";
import monthlyEurFixture from "./__fixtures__/monthly-average-EUR.json";
import convertUsdBrlFixture from "./__fixtures__/convert-USD-BRL-1000.json";
import convertUsdEurFixture from "./__fixtures__/convert-USD-EUR-1000.json";
import convertBrlUsdFixture from "./__fixtures__/convert-BRL-USD-5888.9.json";

describe("ptax/validate — real API fixtures & Invariant C", () => {
  it("validates all real captured fixtures and enforces header.value === last point value across 5 periods x 2 currencies", () => {
    const latest = parsePtaxLatestResponse(latestFixture);
    expect(latest.rates.USD).not.toBeNull();
    expect(latest.rates.EUR).not.toBeNull();

    const histories = [
      usd1DFixture,
      usd1WFixture,
      usd1MFixture,
      usd3MFixture,
      usd1YFixture,
      eur1DFixture,
      eur1WFixture,
      eur1MFixture,
      eur3MFixture,
      eur1YFixture,
    ];

    for (const raw of histories) {
      const h = parsePtaxHistoryResponse(raw);
      expect(h.count).toBeGreaterThan(0);
      const lastPoint = h.points[h.points.length - 1];
      if (!lastPoint) throw new Error("Expected at least one point");
      // Invariant C: header value == last point value of same currency
      expect(lastPoint.value).toBe(latest.rates[h.currency]!.value);
      expect(h.stats.close).toBe(lastPoint.value);
    }

    const monthlyUsd = parsePtaxMonthlyAverageResponse(monthlyUsdFixture);
    const monthlyEur = parsePtaxMonthlyAverageResponse(monthlyEurFixture);
    expect(monthlyUsd.months.length).toBeGreaterThan(0);
    expect(monthlyEur.months.length).toBeGreaterThan(0);

    const conv1 = parsePtaxConvertResponse(convertUsdBrlFixture);
    const conv2 = parsePtaxConvertResponse(convertUsdEurFixture);
    const conv3 = parsePtaxConvertResponse(convertBrlUsdFixture);
    expect(conv1.isCross).toBe(false);
    expect(conv2.isCross).toBe(true);
    expect(conv3.isCross).toBe(false);
  });

  it("validates the real 2025-04-23 1D fixture (6 points, last Fechamento at 16:06:30.443Z)", () => {
    const h = parsePtaxHistoryResponse(usd0423Fixture);
    expect(h.count).toBe(6);
    expect(h.points).toHaveLength(6);
    const sixth = h.points[5];
    expect(sixth?.timestamp).toBe("2025-04-23T16:06:30.443Z");
    expect(sixth?.type).toBe("Fechamento");
    expect(sixth?.provisional).toBe(false);
  });

  it("rejects malformed payloads safely with PtaxValidationError", () => {
    expect(() => parsePtaxLatestResponse(null)).toThrow(PtaxValidationError);
    expect(() => parsePtaxLatestResponse({ side: "sell" })).toThrow(
      PtaxValidationError,
    );
    expect(() =>
      parsePtaxHistoryResponse({
        ...usd1DFixture,
        count: 999, // count mismatch
      }),
    ).toThrow(PtaxValidationError);
    expect(() =>
      parsePtaxMonthlyAverageResponse({
        ...monthlyUsdFixture,
        months: [{ month: "bad", average: "5.0", businessDays: 1, isPartial: false }],
      }),
    ).toThrow(PtaxValidationError);
    expect(() =>
      parsePtaxConvertResponse({
        ...convertUsdBrlFixture,
        result: "NaN",
      }),
    ).toThrow(PtaxValidationError);
  });

  it("identifies 404 feature_disabled and maps 429 / 5xx / validation errors cleanly", () => {
    expect(
      isPtaxFeatureDisabledError(new ApiError(404, "Not Found", "feature_disabled")),
    ).toBe(true);
    expect(
      isPtaxFeatureDisabledError(new ApiError(404, "Not Found", "other")),
    ).toBe(false);
    expect(isPtaxFeatureDisabledError(new Error("network"))).toBe(false);

    expect(mapPtaxErrorToMessage(new ApiError(429, "Too Many Requests"))).toBe(
      PTAX_COPY.errors.rateLimited,
    );
    expect(mapPtaxErrorToMessage(new ApiError(503, "Service Unavailable"))).toBe(
      PTAX_COPY.errors.serverUnavailable,
    );
    expect(mapPtaxErrorToMessage(new PtaxValidationError("bad"))).toBe(
      PTAX_COPY.errors.invalidPayload,
    );
    expect(mapPtaxErrorToMessage(new Error("offline"))).toBe(
      PTAX_COPY.errors.generic,
    );
  });
});
