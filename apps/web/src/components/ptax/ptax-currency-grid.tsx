"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyFlag } from "@/components/ui/flags";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PTAX_CURRENCY_META,
  PTAX_UI_CURRENCIES,
  type PtaxUiCurrency,
} from "@/lib/ptax/constants";
import { PTAX_COPY } from "@/lib/ptax/copy";
import { formatPtaxDecimal, formatPtaxPercent } from "@/lib/ptax/format";
import type { PtaxLatestResponse } from "@/lib/ptax/types";
import { cn } from "@/lib/utils";

interface PtaxCurrencyGridProps {
  selectedCurrency: PtaxUiCurrency;
  onSelectCurrency: (currency: PtaxUiCurrency) => void;
  latest: PtaxLatestResponse | null;
  loading: boolean;
}

export function PtaxCurrencyGrid({
  selectedCurrency,
  onSelectCurrency,
  latest,
  loading,
}: PtaxCurrencyGridProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{PTAX_COPY.currencyGrid.title}</CardTitle>
        <CardDescription>{PTAX_COPY.currencyGrid.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          data-testid="ptax-currency-grid"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {PTAX_UI_CURRENCIES.map((code) => {
            const isSelected = code === selectedCurrency;
            const rate = latest?.rates[code] ?? null;
            const meta = PTAX_CURRENCY_META[code];

            return (
              <button
                key={code}
                type="button"
                aria-pressed={isSelected}
                data-testid={`ptax-currency-card-${code}`}
                onClick={() => onSelectCurrency(code)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-foreground bg-foreground text-background shadow-sm"
                    : "border-border bg-muted/30 text-foreground hover:border-foreground/40 hover:bg-card",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold">
                    <CurrencyFlag currency={code} size={20} />
                    {code}
                  </span>
                  {rate && rate.changePct !== null && (
                    <span
                      className={cn(
                        "font-mono text-[11px] font-semibold tabular-nums",
                        isSelected
                          ? rate.direction === "up"
                            ? "text-emerald-300"
                            : rate.direction === "down"
                              ? "text-red-300"
                              : "text-background/70"
                          : rate.direction === "up"
                            ? "text-success"
                            : rate.direction === "down"
                              ? "text-destructive"
                              : "text-muted-foreground",
                      )}
                    >
                      {rate.direction === "up"
                        ? "↑ "
                        : rate.direction === "down"
                          ? "↓ "
                          : "→ "}
                      {formatPtaxPercent(rate.changePct)}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  {loading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : rate ? (
                    <div className="font-mono text-lg font-bold tabular-nums">
                      {formatPtaxDecimal(rate.value, 4)}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "text-sm font-medium",
                        isSelected
                          ? "text-background/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {PTAX_COPY.currencyGrid.unavailable}
                    </div>
                  )}
                  <div
                    className={cn(
                      "mt-0.5 font-mono text-[11px]",
                      isSelected
                        ? "text-background/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {meta.pairLabel} · {meta.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
