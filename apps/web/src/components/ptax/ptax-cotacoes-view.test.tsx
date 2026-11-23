// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as ptaxApi from "@/lib/ptax/api";
import type {
  PtaxHistoryResponse,
  PtaxLatestResponse,
  PtaxMonthlyAverageResponse,
} from "@/lib/ptax/types";
import { PtaxCotacoesView } from "./ptax-cotacoes-view";
import latestFixture from "@/lib/ptax/__fixtures__/latest.json";
import historyUsd1M from "@/lib/ptax/__fixtures__/history-USD-1M.json";
import monthlyUsd from "@/lib/ptax/__fixtures__/monthly-average-USD.json";

vi.mock("@/lib/feature-flags", () => ({
  featureFlags: {
    cotacoes: true,
    cotacoesChart: true,
    cotacoesCalculadora: false,
    cotacoesAlertas: false,
  },
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  globalThis.ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
  ptaxApi.clearPtaxClientCache();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PtaxCotacoesView — single aviso when a currency has no data", () => {
  it("hides the period selector and the chart's own empty box once the header already shows 'Sem dados disponíveis'", async () => {
    vi.spyOn(ptaxApi, "fetchPtaxLatest").mockResolvedValue({
      ...latestFixture,
      rates: { USD: null, EUR: latestFixture.rates.EUR },
    } as unknown as PtaxLatestResponse);
    vi.spyOn(ptaxApi, "fetchPtaxHistory").mockResolvedValue(
      historyUsd1M as unknown as PtaxHistoryResponse,
    );
    vi.spyOn(ptaxApi, "fetchPtaxMonthlyAverage").mockResolvedValue(
      monthlyUsd as unknown as PtaxMonthlyAverageResponse,
    );

    render(<PtaxCotacoesView />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados disponíveis")).toBeTruthy();
    });

    // The currency-selector tablist (unrelated) must still render; only the
    // chart's own period-selector tablist and empty box must disappear.
    expect(
      screen.queryByRole("tablist", { name: /per[ií]odo/i }),
    ).toBeNull();
    expect(screen.queryByTestId("ptax-chart-empty")).toBeNull();
    expect(screen.queryByTestId("ptax-chart-container")).toBeNull();
    expect(
      screen.getByRole("tablist", { name: /moeda/i }),
    ).toBeTruthy();
    // Redundant "Moedas" grid card was removed from /cotacoes
    expect(screen.queryByTestId("ptax-currency-grid")).toBeNull();
  });

  it("J: does not call fetchPtaxHistory when switching to a currency whose latest rate is null (currencyHasNoData)", async () => {
    vi.spyOn(ptaxApi, "fetchPtaxLatest").mockResolvedValue({
      ...latestFixture,
      rates: { USD: latestFixture.rates.USD, EUR: null },
    } as unknown as PtaxLatestResponse);
    const histSpy = vi
      .spyOn(ptaxApi, "fetchPtaxHistory")
      .mockResolvedValue(historyUsd1M as unknown as PtaxHistoryResponse);
    vi.spyOn(ptaxApi, "fetchPtaxMonthlyAverage").mockResolvedValue(
      monthlyUsd as unknown as PtaxMonthlyAverageResponse,
    );

    render(<PtaxCotacoesView />);

    await waitFor(() => {
      expect(screen.getByTestId("ptax-header-value").textContent).toBe("5,8889");
    });
    expect(histSpy).toHaveBeenCalledTimes(1);
    expect(histSpy).toHaveBeenCalledWith("USD", "1M", expect.anything());

    // Switch to EUR (rates.EUR === null -> currencyHasNoData === true): MUST NOT call fetchPtaxHistory for EUR!
    fireEvent.click(screen.getByRole("tab", { name: /^EUR/ }));
    await waitFor(() => {
      expect(screen.getByText("Sem dados disponíveis")).toBeTruthy();
    });
    expect(histSpy).toHaveBeenCalledTimes(1);
  });
});
