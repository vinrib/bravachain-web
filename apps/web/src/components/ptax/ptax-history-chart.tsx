"use client";

import { useId, type KeyboardEvent } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RefreshCw, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/state";
import {
  PTAX_PERIODS,
  type PtaxPeriod,
  type PtaxUiCurrency,
} from "@/lib/ptax/constants";
import { PTAX_COPY } from "@/lib/ptax/copy";
import {
  computeYAxisDomain,
  formatBrasiliaDateTime,
  formatHistoryPointLabel,
  formatPtaxDecimal,
  toChartScaleNumber,
} from "@/lib/ptax/format";
import type { PtaxHistoryResponse, PtaxSeriesPoint } from "@/lib/ptax/types";
import { cn } from "@/lib/utils";

interface ChartDatum {
  label: string;
  scaleValue: number;
  point: PtaxSeriesPoint;
}

interface PtaxHistoryChartProps {
  currency: PtaxUiCurrency;
  period: PtaxPeriod;
  onSelectPeriod: (period: PtaxPeriod) => void;
  data: PtaxHistoryResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface DotRenderProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: ChartDatum;
}

export function PtaxHistoryChart({
  currency,
  period,
  onSelectPeriod,
  data,
  loading,
  error,
  onRetry,
}: PtaxHistoryChartProps) {
  const rawId = useId();
  const gradientId = `ptax-area-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const handlePeriodKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    idx: number,
  ) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 1 : -1;
      const next = (idx + delta + PTAX_PERIODS.length) % PTAX_PERIODS.length;
      const nextPeriod = PTAX_PERIODS[next];
      if (nextPeriod) {
        onSelectPeriod(nextPeriod);
      }
    }
  };

  const points = data?.points ?? [];
  const chartData: ChartDatum[] = points.map((point) => ({
    label: formatHistoryPointLabel(point, period),
    scaleValue: toChartScaleNumber(point.value),
    point,
  }));

  const numericValues = chartData.map((d) => d.scaleValue);
  const yDomain = computeYAxisDomain(numericValues);
  const avgScale =
    data?.stats.avg !== null && data?.stats.avg !== undefined
      ? toChartScaleNumber(data.stats.avg)
      : null;

  const isSinglePoint = points.length === 1;
  const lastIndex = chartData.length - 1;

  const chartAriaLabel =
    data && points.length > 0 && data.stats.min && data.stats.max
      ? `${PTAX_COPY.chart.ariaLabelTemplate.prefix}${currency}${PTAX_COPY.chart.ariaLabelTemplate.period}${PTAX_COPY.periods.ariaLabels[period]}${PTAX_COPY.chart.ariaLabelTemplate.min}${formatPtaxDecimal(data.stats.min, 4)}${PTAX_COPY.chart.ariaLabelTemplate.max}${formatPtaxDecimal(data.stats.max, 4)}`
      : PTAX_COPY.chart.ariaLabelTemplate.noData;

  const renderLastDot = (props: DotRenderProps) => {
    const { cx, cy, index, payload } = props;
    if (
      cx === undefined ||
      cy === undefined ||
      index !== lastIndex ||
      !payload
    ) {
      return <g key={`empty-dot-${index ?? 0}`} />;
    }

    if (payload.point.provisional) {
      return (
        <g
          key={`last-dot-provisional-${index}`}
          data-testid="ptax-point-provisional"
        >
          <circle
            cx={cx}
            cy={cy}
            r={7}
            fill="var(--card)"
            stroke="var(--warning)"
            strokeWidth={2}
            strokeDasharray="2 2"
          />
          <circle cx={cx} cy={cy} r={3} fill="var(--warning)" />
        </g>
      );
    }

    return (
      <circle
        key={`last-dot-final-${index}`}
        data-testid="ptax-point-final"
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--primary)"
        stroke="var(--card)"
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div
        role="tablist"
        aria-label={PTAX_COPY.periods.groupAriaLabel}
        className="grid grid-cols-5 rounded-xl border border-border bg-muted/50 p-1"
      >
        {PTAX_PERIODS.map((p, idx) => {
          const active = p === period;
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={PTAX_COPY.periods.ariaLabels[p]}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelectPeriod(p)}
              onKeyDown={(e) => handlePeriodKeyDown(e, idx)}
              className={cn(
                "rounded-lg py-1.5 font-mono text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {PTAX_COPY.periods.labels[p]}
            </button>
          );
        })}
      </div>

      {/* Chart viewport — ALWAYS fixed height (300px) and min-w-0 */}
      {loading ? (
        <div
          className="h-[300px] w-full min-w-0"
          data-testid="ptax-chart-loading"
        >
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      ) : error ? (
        <div
          data-testid="ptax-chart-error"
          className="flex h-[300px] w-full min-w-0 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/20 p-6 text-center"
        >
          <AlertCircle className="h-7 w-7 text-destructive" />
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {PTAX_COPY.errors.retry}
          </Button>
        </div>
      ) : points.length === 0 ? (
        <div
          data-testid="ptax-chart-empty"
          className="flex h-[300px] w-full min-w-0 items-center justify-center"
        >
          <EmptyState
            title={PTAX_COPY.chart.emptyTitle}
            description={PTAX_COPY.chart.emptyDescription}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div
            role="img"
            aria-label={chartAriaLabel}
            data-testid="ptax-chart-container"
            className="h-[300px] w-full min-w-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                key={`${currency}-${period}`}
                data={chartData}
                margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  type="category"
                  minTickGap={28}
                  interval="preserveStartEnd"
                  tick={{
                    fontSize: 11,
                    fill: "var(--muted-foreground)",
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={yDomain}
                  width={68}
                  tickFormatter={(v: number) =>
                    formatPtaxDecimal(String(v), 4)
                  }
                  tick={{
                    fontSize: 11,
                    fill: "var(--muted-foreground)",
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<PtaxChartTooltip />} />
                {avgScale !== null && !isSinglePoint && (
                  <ReferenceLine
                    y={avgScale}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.75}
                    label={{
                      value: `${PTAX_COPY.chart.referenceLineLabel} ${formatPtaxDecimal(data?.stats.avg, 4)}`,
                      position: "insideTopRight",
                      fill: "var(--muted-foreground)",
                      fontSize: 10,
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="scaleValue"
                  stroke={isSinglePoint ? "none" : "var(--primary)"}
                  strokeWidth={isSinglePoint ? 0 : 2}
                  fill={isSinglePoint ? "none" : `url(#${gradientId})`}
                  dot={renderLastDot}
                  activeDot={{
                    r: 5,
                    fill: "var(--primary)",
                    stroke: "var(--card)",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {isSinglePoint && points[0] && (
            <div
              data-testid="ptax-single-point-notice"
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs"
            >
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 text-primary" />
                {PTAX_COPY.chart.singlePointNote}
              </span>
              <span className="font-mono font-semibold text-foreground tabular-nums">
                R$ {formatPtaxDecimal(points[0].value, 4)} ·{" "}
                {formatBrasiliaDateTime(points[0].timestamp)} ({points[0].type})
              </span>
            </div>
          )}

          {/* Period stats directly from API `stats` */}
          {data && (
            <div
              data-testid="ptax-chart-stats"
              className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4"
            >
              <StatCell
                label={PTAX_COPY.chart.stats.min}
                value={formatPtaxDecimal(data.stats.min, 4)}
                testId="ptax-stat-min"
              />
              <StatCell
                label={PTAX_COPY.chart.stats.max}
                value={formatPtaxDecimal(data.stats.max, 4)}
                testId="ptax-stat-max"
              />
              <StatCell
                label={PTAX_COPY.chart.stats.avg}
                value={formatPtaxDecimal(data.stats.avg, 4)}
                testId="ptax-stat-avg"
              />
              <StatCell
                label={PTAX_COPY.chart.stats.open}
                value={formatPtaxDecimal(data.stats.open, 4)}
                testId="ptax-stat-open"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        data-testid={testId}
        className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums"
      >
        {value}
      </div>
    </div>
  );
}

function PtaxChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartDatum }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;
  const { point } = datum;

  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs shadow-md">
      <div className="font-mono text-[11px] text-muted-foreground">
        {formatBrasiliaDateTime(point.timestamp)}
      </div>
      <div className="mt-1 font-mono text-sm font-bold text-foreground tabular-nums">
        R$ {formatPtaxDecimal(point.value, 4)}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>
          {PTAX_COPY.chart.tooltip.bulletinTypeLabel}: {point.type}
        </span>
        {point.provisional && (
          <span className="rounded bg-warning/15 px-1.5 py-0.5 font-medium text-warning">
            {PTAX_COPY.chart.tooltip.provisionalTag}
          </span>
        )}
      </div>
    </div>
  );
}
