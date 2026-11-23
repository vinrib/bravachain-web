"use client";

import { useRef, type KeyboardEvent } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CurrencyFlag } from "@/components/ui/flags";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/state";
import {
  PTAX_CURRENCY_META,
  PTAX_UI_CURRENCIES,
  type PtaxUiCurrency,
} from "@/lib/ptax/constants";
import { PTAX_COPY } from "@/lib/ptax/copy";
import {
  formatBrasiliaDateTime,
  formatPtaxDecimal,
  formatPtaxPercent,
  formatPtaxSignedDelta,
} from "@/lib/ptax/format";
import type { PtaxLatestItem } from "@/lib/ptax/types";
import { cn } from "@/lib/utils";

interface PtaxHeaderProps {
  currency: PtaxUiCurrency;
  onSelectCurrency: (currency: PtaxUiCurrency) => void;
  rate: PtaxLatestItem | null;
  loading: boolean;
  error: string | null;
  refreshError?: string | null;
  onRetry: () => void;
}

export function PtaxHeader({
  currency,
  onSelectCurrency,
  rate,
  loading,
  error,
  refreshError = null,
  onRetry,
}: PtaxHeaderProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleTabKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    idx: number,
  ) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") {
      next = (idx + 1) % PTAX_UI_CURRENCIES.length;
    } else if (e.key === "ArrowLeft") {
      next =
        (idx - 1 + PTAX_UI_CURRENCIES.length) % PTAX_UI_CURRENCIES.length;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = PTAX_UI_CURRENCIES.length - 1;
    }
    if (next !== null) {
      e.preventDefault();
      const nextCurrency = PTAX_UI_CURRENCIES[next];
      if (nextCurrency) {
        onSelectCurrency(nextCurrency);
        tabRefs.current[next]?.focus();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Currency selector tabs (keyboard-accessible) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={PTAX_COPY.header.currencyTabsAriaLabel}
          className="inline-flex rounded-xl border border-border bg-muted/60 p-1"
        >
          {PTAX_UI_CURRENCIES.map((code, idx) => {
            const active = code === currency;
            const meta = PTAX_CURRENCY_META[code];
            return (
              <button
                key={code}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => onSelectCurrency(code)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <CurrencyFlag currency={code} size={18} />
                <span>{code}</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {meta.name}
                </span>
              </button>
            );
          })}
        </div>

        {rate?.provisional && (
          <Badge variant="warning" role="status">
            {PTAX_COPY.header.provisionalBadge}
          </Badge>
        )}
      </div>

      {/* Main value + delta + metadata */}
      {loading && !rate ? (
        <div className="space-y-3 py-2" data-testid="ptax-header-loading">
          <Skeleton className="h-11 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      ) : error && !rate ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !rate ? (
        <EmptyState
          title={PTAX_COPY.header.noDataTitle}
          description={PTAX_COPY.header.noDataDescription}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span
                  data-testid="ptax-header-value"
                  className="font-serif text-4xl font-bold tracking-tight text-foreground tabular-nums sm:text-5xl"
                >
                  {formatPtaxDecimal(rate.value, 4)}
                </span>
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {PTAX_CURRENCY_META[currency].pairLabel}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <DirectionBadge
                  direction={rate.direction}
                  changePct={rate.changePct}
                  change={rate.change}
                />
                {rate.previousClose && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {PTAX_COPY.header.previousClosePrefix}
                    {formatPtaxDecimal(rate.previousClose.value, 4)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-muted/40 px-3.5 py-2 font-mono text-xs">
              <div>
                <span className="text-muted-foreground">
                  {PTAX_COPY.header.buyLabel}:{" "}
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatPtaxDecimal(rate.buy, 4)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {PTAX_COPY.header.sellLabel}:{" "}
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatPtaxDecimal(rate.sell, 4)}
                </span>
              </div>
            </div>
          </div>

          {rate.isStale && (
            <div
              role="alert"
              data-testid="ptax-stale-notice"
              className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-xs text-foreground"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <span>{PTAX_COPY.header.staleNotice}</span>
            </div>
          )}

          {refreshError && (
            <div
              role="alert"
              data-testid="ptax-refresh-error"
              className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
              <span>{refreshError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span data-testid="ptax-last-update" className="font-mono">
              {PTAX_COPY.header.lastUpdatePrefix}
              {formatBrasiliaDateTime(rate.asOf)}
              {PTAX_COPY.header.lastUpdateTimezone}
            </span>
            <span className="font-mono">{PTAX_COPY.page.sourceLine}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DirectionBadge({
  direction,
  changePct,
  change,
}: {
  direction: PtaxLatestItem["direction"];
  changePct: string | null;
  change: string | null;
}) {
  if (changePct === null && change === null) {
    return null;
  }

  const toneClass =
    direction === "up"
      ? "text-success"
      : direction === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  // A single arrow glyph conveys direction here — do not pair it with a
  // second (lucide icon) arrow, which previously rendered two overlapping
  // direction indicators ("↗ ↑") side by side.
  const arrowChar = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";

  return (
    <span
      data-testid="ptax-header-delta"
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-xs font-semibold tabular-nums",
        toneClass,
      )}
    >
      <span aria-hidden="true">{arrowChar}</span>
      <span>{formatPtaxPercent(changePct)}</span>
      {change !== null && (
        <span className="font-normal text-muted-foreground">
          ({formatPtaxSignedDelta(change, 4)})
        </span>
      )}
    </span>
  );
}
