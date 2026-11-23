"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/state";
import type { PtaxUiCurrency } from "@/lib/ptax/constants";
import { PTAX_COPY } from "@/lib/ptax/copy";
import {
  computeNiceYAxisTicks,
  formatPtaxDecimal,
  formatPtaxPercent,
  formatYearMonthPtBr,
  toChartScaleNumber,
} from "@/lib/ptax/format";
import type {
  PtaxMonthlyAverageEntry,
  PtaxMonthlyAverageResponse,
} from "@/lib/ptax/types";
import { cn } from "@/lib/utils";

interface MonthlyBarDatum {
  label: string;
  scaleValue: number;
  entry: PtaxMonthlyAverageEntry;
}

interface PtaxMonthlyAverageProps {
  currency: PtaxUiCurrency;
  data: PtaxMonthlyAverageResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function PtaxMonthlyAverage({
  currency,
  data,
  loading,
  error,
  onRetry,
}: PtaxMonthlyAverageProps) {
  const entries = data?.months ?? [];
  const chartData: MonthlyBarDatum[] = entries.map((entry) => ({
    label: formatYearMonthPtBr(entry.month),
    scaleValue: toChartScaleNumber(entry.average),
    entry,
  }));

  const { domain: yDomain, ticks: yTicks } = computeNiceYAxisTicks(
    chartData.map((d) => d.scaleValue),
  );
  const partialEntry = entries.find((m) => m.isPartial) ?? null;

  // Exact 12-month window (first -> last month already present in the API's
  // own `months` array — not a computed/invented value, same boundary points
  // used to draw the bars themselves).
  const windowRangeLabel =
    entries.length > 0
      ? `${formatYearMonthPtBr(entries[0]!.month)}${PTAX_COPY.monthlyAverage.windowRangeSeparator}${formatYearMonthPtBr(entries[entries.length - 1]!.month)}`
      : null;

  const pctRaw = data?.latestVsAveragePct ?? null;
  const pctIsUp = pctRaw !== null && !pctRaw.startsWith("-") && /[1-9]/.test(pctRaw);
  const pctIsDown = pctRaw !== null && pctRaw.startsWith("-") && /[1-9]/.test(pctRaw);

  const ariaLabel =
    data?.average12m
      ? `${PTAX_COPY.monthlyAverage.ariaLabelPrefix}${currency}${PTAX_COPY.monthlyAverage.ariaLabelAveragePrefix}${formatPtaxDecimal(data.average12m, 4)}`
      : `${PTAX_COPY.monthlyAverage.ariaLabelPrefix}${currency}`;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{PTAX_COPY.monthlyAverage.title}</CardTitle>
            <CardDescription>
              {PTAX_COPY.monthlyAverage.subtitle}
            </CardDescription>
          </div>
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {currency}/BRL
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3" data-testid="ptax-monthly-loading">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-[220px] w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-6 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {PTAX_COPY.errors.retry}
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            title={PTAX_COPY.monthlyAverage.emptyTitle}
            description={PTAX_COPY.monthlyAverage.emptyDescription}
          />
        ) : (
          <>
            {/* Summary numbers from API */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="text-[11px] text-muted-foreground">
                  {PTAX_COPY.monthlyAverage.average12mLabel}
                </div>
                <div
                  data-testid="ptax-monthly-avg12m"
                  className="mt-0.5 font-mono text-base font-bold text-foreground tabular-nums"
                >
                  {formatPtaxDecimal(data?.average12m, 4)}
                </div>
                {windowRangeLabel && (
                  <div
                    data-testid="ptax-monthly-window"
                    className="mt-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {windowRangeLabel}
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="text-[11px] text-muted-foreground">
                  {PTAX_COPY.monthlyAverage.latestVsAverageLabel}
                </div>
                <div
                  data-testid="ptax-monthly-vs-avg"
                  className={cn(
                    "mt-0.5 font-mono text-base font-bold tabular-nums",
                    pctIsUp
                      ? "text-success"
                      : pctIsDown
                        ? "text-destructive"
                        : "text-muted-foreground",
                  )}
                >
                  {pctIsUp ? "↑ " : pctIsDown ? "↓ " : ""}
                  {formatPtaxPercent(data?.latestVsAveragePct)}
                </div>
              </div>
            </div>

            {/* Monthly bar chart */}
            <div
              role="img"
              aria-label={ariaLabel}
              data-testid="ptax-monthly-chart"
              className="h-[220px] w-full min-w-0"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  key={`monthly-${currency}`}
                  data={chartData}
                  margin={{ top: 8, right: 20, left: -12, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="label"
                    type="category"
                    minTickGap={18}
                    interval="preserveStartEnd"
                    tick={{
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                      fontFamily: "var(--font-mono)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={yDomain}
                    ticks={yTicks}
                    width={58}
                    tickFormatter={(v: number) =>
                      formatPtaxDecimal(String(v), 2)
                    }
                    tick={{
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                      fontFamily: "var(--font-mono)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<MonthlyBarTooltip />} />
                  <Bar
                    dataKey="scaleValue"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={false}
                  >
                    {chartData.map((d) => (
                      <Cell
                        key={d.entry.month}
                        fill={
                          d.entry.isPartial
                            ? "var(--warning)"
                            : "var(--primary)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {partialEntry && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="warning">
                  {formatYearMonthPtBr(partialEntry.month)} —{" "}
                  {PTAX_COPY.monthlyAverage.partialBadge}
                </Badge>
                <span className="font-mono text-[11px]">
                  ({partialEntry.businessDays}
                  {PTAX_COPY.monthlyAverage.businessDaysSuffix})
                </span>
              </div>
            )}

            {/* Calculation method note — maintained front-end copy, never the
                raw API `method` string (kept in the type for API-contract
                compatibility only; not rendered). */}
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs">
              <div className="font-semibold text-foreground">
                {PTAX_COPY.monthlyAverage.methodHeading}
              </div>
              <p
                data-testid="ptax-monthly-method"
                className="mt-1 leading-relaxed text-muted-foreground"
              >
                {PTAX_COPY.monthlyAverage.methodDescription}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MonthlyBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: MonthlyBarDatum }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;
  const { entry } = datum;

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
        <span>{formatYearMonthPtBr(entry.month)}</span>
        {entry.isPartial && (
          <span className="rounded bg-warning/15 px-1.5 py-0.5 font-medium text-warning">
            {PTAX_COPY.monthlyAverage.partialBadge}
          </span>
        )}
      </div>
      <div className="mt-1 font-mono text-sm font-bold text-foreground tabular-nums">
        R$ {formatPtaxDecimal(entry.average, 4)}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">
        {entry.businessDays}
        {PTAX_COPY.monthlyAverage.businessDaysSuffix}
      </div>
    </div>
  );
}
