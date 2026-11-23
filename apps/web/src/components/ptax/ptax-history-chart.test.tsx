// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/client-api";
import * as ptaxApi from "@/lib/ptax/api";
import { PTAX_COPY } from "@/lib/ptax/copy";
import type { PtaxHistoryResponse, PtaxLatestItem } from "@/lib/ptax/types";
import { PtaxCalculator } from "./ptax-calculator";
import { PtaxHeader } from "./ptax-header";
import {
  PtaxHistoryChart,
  renderPtaxXAxisTick,
} from "./ptax-history-chart";
import { planXAxisTicks } from "@/lib/ptax/format";
import usd0423Fixture from "@/lib/ptax/__fixtures__/history-USD-1D-2025-04-23.json";
import latestFixture from "@/lib/ptax/__fixtures__/latest.json";
import convertUsdBrlFixture from "@/lib/ptax/__fixtures__/convert-USD-BRL-1000.json";

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

  it("C: displays 'Valor considerado: 1.500,00 USD' for pt-BR input '1.500' and sets aria-live on result container", async () => {
    vi.spyOn(ptaxApi, "fetchPtaxConvert").mockResolvedValue(
      convertUsdBrlFixture as never,
    );

    render(<PtaxCalculator enabled={true} />);
    const input = screen.getByLabelText(/Valor \(USD\)/i);
    fireEvent.change(input, { target: { value: "1.500" } });

    expect(screen.getByTestId("ptax-calculator-considered").textContent).toBe(
      "Valor considerado: 1.500,00 USD",
    );

    const liveBox = screen.getByTestId("ptax-calculator-result-region");
    expect(liveBox.getAttribute("aria-live")).toBe("polite");
    expect(liveBox.getAttribute("aria-atomic")).toBe("true");
  });
});

describe("Review fixes A, G, I — XAxis payload.index, refreshError preservation, and keyboard focus", () => {
  it("A: renderPtaxXAxisTick looks up xTickPlan by payload.index and anchors last visible tick 'end' (or 'middle' when 1 tick)", () => {
    // 1Y-like 248-point plan where Recharts filters down to 5 visible ticks (index 0..4, payload.index up to 247)
    const labels1Y = Array.from({ length: 248 }, (_, i) => `d${i}`);
    const plan1Y = planXAxisTicks(labels1Y);

    const lastTick = renderPtaxXAxisTick(plan1Y, {
      x: 400,
      y: 260,
      index: 4,
      visibleTicksCount: 5,
      payload: { value: "19/11/26", index: 247 },
    });
    const { container, rerender } = render(<svg>{lastTick}</svg>);
    const textEl = container.querySelector("text");
    expect(textEl?.getAttribute("text-anchor")).toBe("end");
    expect(textEl?.textContent).toBe("19/11/26");

    // Single visible tick (1-point chart) must be centered ("middle"), not "end"
    const singlePlan = planXAxisTicks(["10:05"]);
    rerender(
      <svg>
        {renderPtaxXAxisTick(singlePlan, {
          x: 200,
          y: 260,
          index: 0,
          visibleTicksCount: 1,
          payload: { value: "10:05", index: 0 },
        })}
      </svg>,
    );
    expect(container.querySelector("text")?.getAttribute("text-anchor")).toBe(
      "middle",
    );

    // 1D with duplicate minute at data index 4 (show=false), even when Recharts visible index is 2
    const plan1D = planXAxisTicks(["10:11", "11:11", "12:11", "13:04", "13:04"]);
    rerender(
      <svg>
        {renderPtaxXAxisTick(plan1D, {
          x: 350,
          y: 260,
          index: 2,
          visibleTicksCount: 3,
          payload: { value: "13:04", index: 4 },
        })}
      </svg>,
    );
    expect(container.querySelector("text")).toBeNull();
  });

  it("G: PtaxHeader keeps displayed quote & timestamp when refreshError is set, showing discreet notice", () => {
    render(
      <PtaxHeader
        currency="USD"
        onSelectCurrency={vi.fn()}
        rate={usdRate}
        loading={false}
        error={null}
        refreshError="Não foi possível atualizar agora."
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ptax-header-value").textContent).toBe("5,8889");
    expect(screen.getByTestId("ptax-last-update").textContent).toContain(
      PTAX_COPY.header.lastUpdateTimezone,
    );
    const notice = screen.getByTestId("ptax-refresh-error");
    expect(notice.getAttribute("role")).toBe("alert");
    expect(notice.textContent).toContain("Não foi possível atualizar agora.");
    // Polled quote value MUST NOT have aria-live
    expect(
      screen.getByTestId("ptax-header-value").getAttribute("aria-live"),
    ).toBeNull();
  });

  it("I: ArrowLeft/ArrowRight/Home/End move DOM focus on currency tabs and period tabs, and chart error has role=alert", () => {
    const onCurrency = vi.fn();
    const onPeriod = vi.fn();
    render(
      <>
        <PtaxHeader
          currency="USD"
          onSelectCurrency={onCurrency}
          rate={usdRate}
          loading={false}
          error={null}
          onRetry={vi.fn()}
        />
        <PtaxHistoryChart
          currency="USD"
          period="1M"
          onSelectPeriod={onPeriod}
          data={null}
          loading={false}
          error={PTAX_COPY.errors.serverUnavailable}
          onRetry={vi.fn()}
        />
      </>,
    );

    const usdTab = screen.getByRole("tab", { name: /USD/ });
    const eurTab = screen.getByRole("tab", { name: /EUR/ });
    usdTab.focus();
    fireEvent.keyDown(usdTab, { key: "ArrowRight" });
    expect(onCurrency).toHaveBeenCalledWith("EUR");
    expect(document.activeElement).toBe(eurTab);
    fireEvent.keyDown(eurTab, { key: "Home" });
    expect(onCurrency).toHaveBeenCalledWith("USD");
    expect(document.activeElement).toBe(usdTab);
    fireEvent.keyDown(usdTab, { key: "End" });
    expect(onCurrency).toHaveBeenCalledWith("EUR");
    expect(document.activeElement).toBe(eurTab);

    const tab1M = screen.getByRole("tab", { name: PTAX_COPY.periods.ariaLabels["1M"] });
    const tab3M = screen.getByRole("tab", { name: PTAX_COPY.periods.ariaLabels["3M"] });
    const tab1D = screen.getByRole("tab", { name: PTAX_COPY.periods.ariaLabels["1D"] });
    const tab1Y = screen.getByRole("tab", { name: PTAX_COPY.periods.ariaLabels["1Y"] });
    tab1M.focus();
    fireEvent.keyDown(tab1M, { key: "ArrowRight" });
    expect(onPeriod).toHaveBeenCalledWith("3M");
    expect(document.activeElement).toBe(tab3M);
    fireEvent.keyDown(tab3M, { key: "Home" });
    expect(onPeriod).toHaveBeenCalledWith("1D");
    expect(document.activeElement).toBe(tab1D);
    fireEvent.keyDown(tab1D, { key: "End" });
    expect(onPeriod).toHaveBeenCalledWith("1Y");
    expect(document.activeElement).toBe(tab1Y);

    expect(screen.getByTestId("ptax-chart-error").getAttribute("role")).toBe(
      "alert",
    );
  });
});
