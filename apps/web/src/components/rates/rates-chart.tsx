"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/state";
import { TabsPill } from "@/components/ui/tabs-pill";
import { cn } from "@/lib/utils";
import { getRateHistory } from "@/lib/rates/api";
import { formatRate4 } from "./rates-live-cards";
import {
  PAIRS,
  PERIODS,
  type HistoryPeriod,
  type RateHistory,
  type RatePair,
} from "@/lib/rates/types";

const GRID = "color-mix(in srgb, var(--border) 60%, transparent)";
const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };

function axisLabel(iso: string, intraday: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return intraday
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function RatesChart() {
  const [pair, setPair] = useState<RatePair>("USD_BRL");
  const [period, setPeriod] = useState<HistoryPeriod>("1M");
  const [data, setData] = useState<RateHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    getRateHistory(pair, period)
      .then((r) => {
        if (active) setData(r);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pair, period, nonce]);

  const points = data?.points ?? [];
  const stats = data?.stats;

  // Y domain from the actual point rates (numbers), with a little padding.
  const rates = points.map((p) => p.rate);
  const lo = rates.length ? Math.min(...rates) : 0;
  const hi = rates.length ? Math.max(...rates) : 0;
  const pad = hi > lo ? (hi - lo) * 0.1 : hi * 0.001 || 0.01;
  const yDomain: [number, number] = [lo - pad, hi + pad];

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <TabsPill
            tabs={PAIRS.map((p) => ({ value: p.value, label: p.label }))}
            value={pair}
            onChange={setPair}
          />
          <TabsPill
            tabs={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
            value={period}
            onChange={setPeriod}
          />
        </div>

        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : error ? (
          <ErrorState message="Não foi possível carregar o histórico." onRetry={() => setNonce((n) => n + 1)} />
        ) : points.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            Histórico ainda sendo coletado.
          </p>
        ) : (
          <>
            {/* Textual summary for screen readers */}
            <p className="sr-only">
              Gráfico de {pair.replace("_", "/")} no período {period}. Mínimo{" "}
              {formatRate4(stats?.min ?? null)}, máximo {formatRate4(stats?.max ?? null)}, média{" "}
              {formatRate4(stats?.avg ?? null)}.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={points} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis
                  dataKey="timestamp"
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => axisLabel(String(v), period === "1D")}
                  minTickGap={32}
                />
                <YAxis
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  domain={yDomain}
                  tickFormatter={(v) => formatRate4(Number(v))}
                />
                <Tooltip
                  labelFormatter={(l) => new Date(String(l)).toLocaleString("pt-BR")}
                  formatter={(v) => [`R$ ${formatRate4(Number(v))}`, "Taxa"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#12a46b"
                  strokeWidth={2}
                  dot={points.length === 1 ? { r: 4, fill: "#12a46b" } : false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {points.length === 1 && (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Poucos dados neste período.
              </p>
            )}

            {/* Period stats only make sense with 2+ points. */}
            {stats && points.length >= 2 && (
              <>
                <PeriodVariation open={stats.open} points={points} />
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Mínimo" value={stats.min} />
                  <Stat label="Máximo" value={stats.max} />
                  <Stat label="Média" value={stats.avg} />
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PeriodVariation({
  open,
  points,
}: {
  open: number | null;
  points: Array<{ rate: number }>;
}) {
  const last = points[points.length - 1]?.rate;
  if (open === null || open === 0 || last === undefined) return null;
  const pct = ((last - open) / open) * 100;
  const dir = pct > 0.0001 ? "up" : pct < -0.0001 ? "down" : "stable";
  const sign = dir === "up" ? "+" : dir === "down" ? "−" : "";
  return (
    <p
      className={cn(
        "mt-3 text-center text-sm font-medium tabular-nums",
        dir === "up" && "text-[#0b6b4f] dark:text-[#7be0b0]",
        dir === "down" && "text-[#b03030]",
        dir === "stable" && "text-muted-foreground",
      )}
    >
      {sign}
      {Math.abs(pct).toFixed(2)}% no período
    </p>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-foreground">
        R$ {formatRate4(value)}
      </p>
    </div>
  );
}
