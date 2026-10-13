"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@bravachain/shared";
import { Card, CardContent } from "@/components/ui/card";
import {
  CATEGORICAL,
  COLOR_EUR,
  COLOR_PARTIAL,
  COLOR_TPV,
  COLOR_USD,
  compactBrl,
  formatRate,
} from "@/lib/dashboard/chart";
import type { RailSlice, RatePoint, TpvPoint } from "@/lib/dashboard/types";

const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" };
const GRID = "color-mix(in srgb, var(--border) 60%, transparent)";

function ChartCard({
  title,
  subtitle,
  legend,
  empty,
  children,
}: {
  title: string;
  subtitle?: string;
  legend?: React.ReactNode;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {legend}
        </div>
        {empty ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sem dados no período.
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

export function TpvChart({ data }: { data: TpvPoint[] }) {
  return (
    <ChartCard
      title="Volume recebido por mês"
      subtitle="em reais"
      empty={data.length === 0}
      legend={
        <div className="flex gap-3">
          <LegendDot color={COLOR_TPV} label="Mês completo" />
          <LegendDot color={COLOR_PARTIAL} label="Parcial" />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v) => compactBrl(Number(v))}
          />
          <Tooltip
            cursor={{ fill: GRID }}
            formatter={(v) => [formatMoney(Number(v)), "Volume"]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((p, i) => (
              <Cell key={i} fill={p.partial ? COLOR_PARTIAL : COLOR_TPV} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RailsChart({ data }: { data: RailSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard
      title="Volume por forma de recebimento"
      subtitle="participação no período"
      empty={data.length === 0}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <ResponsiveContainer width="100%" height={180} className="max-w-[200px]">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={78}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [formatMoney(Number(v)), "Volume"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <ul className="w-full space-y-1.5">
          {data.map((d, i) => {
            const pct = d.percent ?? (total > 0 ? (d.value / total) * 100 : 0);
            return (
              <li key={d.name} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: CATEGORICAL[i % CATEGORICAL.length] }}
                  />
                  <span className="truncate text-foreground">{d.name}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {pct.toFixed(0)}% · {formatMoney(d.value)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </ChartCard>
  );
}

export function RatesChart({ data }: { data: RatePoint[] }) {
  const last = data[data.length - 1];
  return (
    <ChartCard
      title="Taxas de câmbio aplicadas por mês"
      subtitle="média mensal · R$ por unidade"
      empty={data.length === 0}
      legend={
        <div className="flex gap-3">
          <LegendDot color={COLOR_USD} label={`USD ${last ? formatRate(last.usd) : ""}`} />
          <LegendDot color={COLOR_EUR} label={`EUR ${last ? formatRate(last.eur) : ""}`} />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            domain={["auto", "auto"]}
            tickFormatter={(v) => formatRate(Number(v))}
          />
          <Tooltip
            formatter={(v, name) => [formatRate(Number(v)), String(name).toUpperCase()]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line
            type="monotone"
            dataKey="usd"
            stroke={COLOR_USD}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="eur"
            stroke={COLOR_EUR}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
