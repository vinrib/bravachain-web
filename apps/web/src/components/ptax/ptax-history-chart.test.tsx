// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/client-api";
import * as ptaxApi from "@/lib/ptax/api";
import { PTAX_COPY } from "@/lib/ptax/copy";
import type { PtaxHistoryResponse, PtaxLatestItem } from "@/lib/ptax/types";
import { PtaxCalculator } from "./ptax-calculator";
import { PtaxHeader } from "./ptax-header";
import { PtaxHistoryChart } from "./ptax-history-chart";
import usd0423Fixture from "@/lib/ptax/__fixtures__/history-USD-1D-2025-04-23.json";
import latestFixture from "@/lib/ptax/__fixtures__/latest.json";

// Minimal ResizeObserver mock for Recharts ResponsiveContainer in jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const baseHistory = usd0423Fixture as unknown as PtaxHistoryResponse;
const usdRate = latestFixture.rates.USD as unknown as PtaxLatestItem;

describe("PtaxHistoryChart states & checklist", () => {
  it("renders fixed-height loading skeleton", () => {
    render(
      <PtaxHistoryChart
        currency="USD"
        period="1M"
        onSelectPeriod={vi.fn()}
        data={null}
        loading={true}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    const box = screen.getByTestId("ptax-chart-loading");
    expect(box.className).toContain("h-[300px]");
    expect(box.className).toContain("min-w-0");
  });

  it("renders controlled error state (429/5xx) with 'Tentar de novo' button", () => {
    const onRetry = vi.fn();
    render(
      <PtaxHistoryChart
        currency="USD"
        period="1M"
        onSelectPeriod={vi.fn()}
        data={null}
        loading={false}
        error={PTAX_COPY.errors.rateLimited}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText(PTAX_COPY.errors.rateLimited)).toBeTruthy();
    const retryBtn = screen.getByRole("button", { name: PTAX_COPY.errors.retry });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders neutral empty state when points is []", () => {
    const empty: PtaxHistoryResponse = {
      ...baseHistory,
      points: [],
      count: 0,
      asOf: null,
      stats: {
        min: null,
        max: null,
        avg: null,
        open: null,
        close: null,
        periodChange: null,
        periodChangePct: null,
      },
    };
    render(
      <PtaxHistoryChart
        currency="USD"
        period="1D"
        onSelectPeriod={vi.fn()}
        data={empty}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ptax-chart-empty")).toBeTruthy();
    expect(screen.getByText(PTAX_COPY.chart.emptyTitle)).toBeTruthy();
  });

  it("renders explicit single-point early-day 1D state (normal, not error) with value and note", () => {
    const firstPoint = baseHistory.points[0];
    if (!firstPoint) throw new Error("Expected fixture first point");
    const onePoint: PtaxHistoryResponse = {
      ...baseHistory,
      points: [{ ...firstPoint, provisional: true }],
      count: 1,
      stats: {
        min: firstPoint.value,
        max: firstPoint.value,
        avg: firstPoint.value,
        open: firstPoint.value,
        close: firstPoint.value,
        periodChange: "0.000000",
        periodChangePct: "0.000000",
      },
    };
    render(
      <PtaxHistoryChart
        currency="USD"
        period="1D"
        onSelectPeriod={vi.fn()}
        data={onePoint}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    const container = screen.getByTestId("ptax-chart-container");
    expect(container.getAttribute("role")).toBe("img");
    expect(container.getAttribute("aria-label")).toContain("USD");
    expect(container.className).toContain("h-[300px]");
    expect(container.className).toContain("min-w-0");
    expect(screen.getByTestId("ptax-single-point-notice")).toBeTruthy();
    expect(screen.getByText(PTAX_COPY.chart.singlePointNote)).toBeTruthy();
  });

  it("renders 2-point and N-point (2025-04-23) series with stats from API and keyboard period navigation", () => {
    const onSelectPeriod = vi.fn();
    const { rerender } = render(
      <PtaxHistoryChart
        currency="USD"
        period="1D"
        onSelectPeriod={onSelectPeriod}
        data={{
          ...baseHistory,
          points: baseHistory.points.slice(0, 2),
          count: 2,
        }}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("ptax-single-point-notice")).toBeNull();
    expect(screen.getByTestId("ptax-chart-container")).toBeTruthy();

    // Keyboard arrow switches period 1D -> 1W
    const tab1D = screen.getByRole("tab", {
      name: PTAX_COPY.periods.ariaLabels["1D"],
    });
    fireEvent.keyDown(tab1D, { key: "ArrowRight" });
    expect(onSelectPeriod).toHaveBeenCalledWith("1W");

    // Full 6-point 2025-04-23 fixture displays API stats formatted in pt-BR (4 decimals)
    rerender(
      <PtaxHistoryChart
        currency="USD"
        period="1D"
        onSelectPeriod={onSelectPeriod}
        data={baseHistory}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ptax-stat-min").textContent).toBe("5,6805");
    expect(screen.getByTestId("ptax-stat-max").textContent).toBe("5,6977");
    expect(screen.getByTestId("ptax-stat-avg").textContent).toBe("5,6880");
    expect(screen.getByTestId("ptax-stat-open").textContent).toBe("5,6827");
  });
});

describe("PtaxHeader accessibility, stale & provisional indicators", () => {
  it("renders Brasília time, direction arrow/sign, stale warning, provisional badge, and BCB source", () => {
    const onSelect = vi.fn();
    render(
      <PtaxHeader
        currency="USD"
        onSelectCurrency={onSelect}
        rate={{ ...usdRate, isStale: true, provisional: true }}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByTestId("ptax-stale-notice")).toBeTruthy();
    expect(screen.getByText(PTAX_COPY.header.provisionalBadge)).toBeTruthy();
    expect(screen.getByText(PTAX_COPY.page.sourceLine)).toBeTruthy();
    expect(screen.getByTestId("ptax-last-update").textContent).toContain(
      PTAX_COPY.header.lastUpdateTimezone,
    );
    expect(screen.getByTestId("ptax-header-delta").textContent).toMatch(
      /[↑↓→]/,
    );

    const usdTab = screen.getByRole("tab", { name: /USD/ });
    fireEvent.keyDown(usdTab, { key: "ArrowRight" });
    expect(onSelect).toHaveBeenCalledWith("EUR");
  });

  it("renders neutral empty state when rate is null", () => {
    render(
      <PtaxHeader
        currency="USD"
        onSelectCurrency={vi.fn()}
        rate={null}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(PTAX_COPY.header.noDataTitle)).toBeTruthy();
  });
});

describe("PtaxCalculator flag & 404 feature_disabled auto-hide", () => {
  it("auto-hides completely when the backend responds 404 { code: 'feature_disabled' }", async () => {
    vi.spyOn(ptaxApi, "fetchPtaxConvert").mockRejectedValue(
      new ApiError(404, "Not Found", "feature_disabled"),
    );

    render(<PtaxCalculator enabled={true} />);
    expect(screen.getByTestId("ptax-calculator")).toBeTruthy();

    await waitFor(
      () => {
        expect(screen.queryByTestId("ptax-calculator")).toBeNull();
      },
      { timeout: 2000 },
    );
  });
});
