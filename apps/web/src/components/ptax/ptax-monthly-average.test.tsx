// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PTAX_COPY } from "@/lib/ptax/copy";
import type { PtaxMonthlyAverageResponse } from "@/lib/ptax/types";
import { PtaxMonthlyAverage } from "./ptax-monthly-average";
import monthlyUsdFixture from "@/lib/ptax/__fixtures__/monthly-average-USD.json";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  globalThis.ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
});

const baseData = monthlyUsdFixture as unknown as PtaxMonthlyAverageResponse;

describe("PtaxMonthlyAverage — review fixes (method copy & period window)", () => {
  it("never renders the raw API `method` string, even when it contains code identifiers", () => {
    // The fixture's `method` field mirrors what the real API currently returns
    // (unaccented, with ROUND_HALF_UP / average12m identifiers leaking through).
    // The component must show the maintained PTAX_COPY description instead of
    // passing that string through to the screen.
    render(
      <PtaxMonthlyAverage
        currency="USD"
        data={baseData}
        loading={false}
        error={null}
        onRetry={() => {}}
      />,
    );
    const method = screen.getByTestId("ptax-monthly-method");
    expect(method.textContent).not.toMatch(
      /ROUND_|average12m|ultimo|aritmetica|\bnao\b/i,
    );
    expect(method.textContent).toBe(
      PTAX_COPY.monthlyAverage.methodDescription,
    );
  });

  it("shows the exact 12-month window (first to last month) next to the average", () => {
    render(
      <PtaxMonthlyAverage
        currency="USD"
        data={baseData}
        loading={false}
        error={null}
        onRetry={() => {}}
      />,
    );
    // baseData.months spans 2025-12 .. 2026-11 (fixture data)
    expect(screen.getByTestId("ptax-monthly-window").textContent).toBe(
      "dez/25 – nov/26",
    );
  });
});
