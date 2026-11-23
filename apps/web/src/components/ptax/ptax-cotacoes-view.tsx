"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RatesAlerts } from "@/components/rates/rates-alerts";
import { featureFlags } from "@/lib/feature-flags";
import type { PtaxPeriod, PtaxUiCurrency } from "@/lib/ptax/constants";
import { PTAX_COPY } from "@/lib/ptax/copy";
import {
  usePtaxHistory,
  usePtaxLatest,
  usePtaxMonthlyAverage,
} from "@/lib/ptax/hooks";
import { PtaxCalculator } from "./ptax-calculator";
import { PtaxHeader } from "./ptax-header";
import { PtaxHistoryChart } from "./ptax-history-chart";
import { PtaxMonthlyAverage } from "./ptax-monthly-average";

export function PtaxCotacoesView() {
  const [currency, setCurrency] = useState<PtaxUiCurrency>("USD");
  const [period, setPeriod] = useState<PtaxPeriod>("1M");

  const latest = usePtaxLatest();
  const selectedRate = latest.data?.rates[currency] ?? null;
  // Once the header has definitively shown its own "sem dados" notice, a
  // period selector and a second empty chart box underneath it would be a
  // redundant second warning for the exact same condition — show one aviso,
  // and skip fetching `/v1/ptax/history` for that currency altogether.
  const currencyHasNoData =
    !latest.loading && !latest.error && !selectedRate;

  const history = usePtaxHistory(
    currency,
    period,
    featureFlags.cotacoesChart && !currencyHasNoData,
  );
  const monthly = usePtaxMonthlyAverage(currency);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page title & neutral subtitle */}
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">
          {PTAX_COPY.page.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {PTAX_COPY.page.subtitle}
        </p>
      </div>

      {/* Top row: Main Quote + Chart (2 cols) and 12-Month Average (1 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardContent className="space-y-6 p-6">
            <PtaxHeader
              currency={currency}
              onSelectCurrency={setCurrency}
              rate={selectedRate}
              loading={latest.loading}
              error={latest.error}
              refreshError={latest.refreshError}
              onRetry={latest.reload}
            />

            {featureFlags.cotacoesChart && !currencyHasNoData && (
              <PtaxHistoryChart
                currency={currency}
                period={period}
                onSelectPeriod={setPeriod}
                data={history.data}
                loading={history.loading}
                error={history.error}
                onRetry={history.reload}
              />
            )}
          </CardContent>
        </Card>

        <div className="min-w-0">
          <PtaxMonthlyAverage
            currency={currency}
            data={monthly.data}
            loading={monthly.loading}
            error={monthly.error}
            onRetry={monthly.reload}
          />
        </div>
      </div>

      {/* Bottom row: Reference Calculator (flag-gated, auto-hides on API 404) */}
      {featureFlags.cotacoesCalculadora && (
        <div className="min-w-0">
          <PtaxCalculator enabled={featureFlags.cotacoesCalculadora} />
        </div>
      )}

      {/* Legacy alerts component kept strictly behind cotacoesAlertas (default OFF) */}
      {featureFlags.cotacoesAlertas && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            {PTAX_COPY.page.alertsSectionTitle}
          </h2>
          <RatesAlerts />
        </section>
      )}
    </div>
  );
}
