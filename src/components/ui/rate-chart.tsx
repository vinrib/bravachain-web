"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { Currency } from "@/lib/types";
import { FALLBACK_RATES } from "@/lib/constants";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DataPoint {
  date: string;
  rate: number;
  fullDate: string;
}

function generateHistory(from: Currency, to: Currency): DataPoint[] {
  if (from === to) return [];
  const key = `${from}/${to}`;
  const base = FALLBACK_RATES[key] ?? 1;

  const data: DataPoint[] = [];
  let prev = base * (0.96 + Math.random() * 0.08);

  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    const volatility = 0.007;
    const drift = (base - prev) * 0.03;
    const noise = (Math.random() - 0.5) * 2 * volatility * prev;
    prev = Math.max(0.0001, prev + drift + noise);

    const label =
      i === 0
        ? "Hoje"
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    const fullLabel = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    data.push({
      date: label,
      rate: Number(prev.toFixed(from === "BRL" ? 4 : 6)),
      fullDate: fullLabel,
    });
  }
  return data;
}

interface CustomTooltipProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: readonly any[];
  label?: string | number;
  from: Currency;
  to: Currency;
}

function CustomTooltip({ active, payload, label, from, to }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value as number | undefined;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-foreground">
        1 {from} = {value} {to}
      </p>
    </div>
  );
}

interface RateChartProps {
  fromCurrency: Currency;
  toCurrency: Currency;
  className?: string;
}

export function RateChart({ fromCurrency, toCurrency, className }: RateChartProps) {
  if (fromCurrency === toCurrency) return null;

  const data = generateHistory(fromCurrency, toCurrency);
  if (data.length === 0) return null;

  const first = data[0].rate;
  const last = data[data.length - 1].rate;
  const change = ((last - first) / first) * 100;
  const isPositive = change >= 0;

  const minRate = Math.min(...data.map((d) => d.rate));
  const maxRate = Math.max(...data.map((d) => d.rate));
  const padding = (maxRate - minRate) * 0.15 || maxRate * 0.05;

  // Show every 7th label to avoid crowding
  const tickIndices = new Set([0, 6, 13, 20, 29]);

  const color = isPositive ? "#00b67a" : "#ef4444";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Taxa {fromCurrency}/{toCurrency} — 30 dias
        </span>
        <span
          className={cn(
            "text-xs font-bold",
            isPositive ? "text-success" : "text-destructive"
          )}
        >
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="0"
            vertical={false}
            stroke="var(--border)"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v, i) => (tickIndices.has(i) ? v : "")}
          />
          <YAxis
            domain={[minRate - padding, maxRate + padding]}
            hide
          />
          <Tooltip
            content={(props) => (
              <CustomTooltip
                {...props}
                from={fromCurrency}
                to={toCurrency}
              />
            )}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: color,
              stroke: "var(--card)",
              strokeWidth: 2,
            }}
          />
          {/* Reference line at current rate */}
          <ReferenceLine
            y={last}
            stroke={color}
            strokeDasharray="3 3"
            strokeOpacity={0.4}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>30 dias atrás</span>
        <span>Hoje · 1 {fromCurrency} = {last} {toCurrency}</span>
      </div>
    </div>
  );
}
