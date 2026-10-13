"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LineChart as LineChartIcon, Star } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { KpiCard, MetricDelta } from "./kpi-card";
import { TpvChart, RailsChart, RatesChart } from "./charts";
import { getSummary, getTpv, getRails, getRates } from "@/lib/dashboard/api";
import { formatRate } from "@/lib/dashboard/chart";
import {
  PERIODS,
  type DashboardPeriod,
  type DashboardSummary,
  type RailSlice,
  type RatePoint,
  type TpvPoint,
} from "@/lib/dashboard/types";

const CAPTION = "vs. período anterior";

export function DashboardFinanceiro() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tpv, setTpv] = useState<TpvPoint[]>([]);
  const [rails, setRails] = useState<RailSlice[]>([]);
  const [rates, setRates] = useState<RatePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    Promise.all([
      getSummary(period),
      getTpv(period),
      getRails(period),
      getRates(period),
    ])
      .then(([s, t, ra, rt]) => {
        if (!active) return;
        setSummary(s);
        setTpv(t);
        setRails(ra);
        setRates(rt);
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
  }, [period, nonce]);

  const hasData =
    !!summary &&
    (summary.tpv !== null ||
      summary.feesPaid !== null ||
      summary.withdrawals !== null ||
      tpv.length > 0 ||
      rails.length > 0 ||
      rates.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe volume, câmbio e taxas do período
        </p>
      </div>

      {/* Period selector */}
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              period === p.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Não foi possível carregar os dados
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Seus saldos e pagamentos não foram afetados. Tente carregar o painel
              novamente.
            </p>
            <Button type="button" className="mt-1" onClick={() => setNonce((n) => n + 1)}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <LineChartIcon className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Você ainda não tem movimentações no período
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Os indicadores aparecem aqui assim que o primeiro pagamento for recebido.
            </p>
            <Button asChild className="mt-1 gap-2">
              <Link href="/recebimentos">
                Ir para Recebimentos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KpiCard
              label="Volume recebido (TPV)"
              value={summary!.tpv !== null ? formatMoney(summary!.tpv) : "—"}
              variation={summary!.tpvVariation}
              caption={CAPTION}
            />

            {/* Taxa média de câmbio (USD/EUR) */}
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">
                  Taxa média de câmbio aplicada
                </p>
                <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
                  <div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-current text-amber-500" /> USD
                    </p>
                    <p className="text-lg font-bold tabular-nums text-foreground">
                      R$ {formatRate(summary!.avgRateUsd)}
                    </p>
                    <MetricDelta variation={summary!.avgRateUsdVariation} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">EUR</p>
                    <p className="text-lg font-bold tabular-nums text-foreground">
                      R$ {formatRate(summary!.avgRateEur)}
                    </p>
                    <MetricDelta variation={summary!.avgRateEurVariation} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  R$ por unidade · {CAPTION}
                </p>
              </CardContent>
            </Card>

            <KpiCard
              label="Taxas pagas à Bravachain"
              value={summary!.feesPaid !== null ? formatMoney(summary!.feesPaid) : "—"}
              variation={summary!.feesPaidVariation}
              caption={CAPTION}
            />
            <KpiCard
              label="Saques realizados"
              value={summary!.withdrawals !== null ? formatMoney(summary!.withdrawals) : "—"}
              variation={summary!.withdrawalsVariation}
              caption={CAPTION}
            />
          </div>

          {/* Charts */}
          <TpvChart data={tpv} />
          <RailsChart data={rails} />
          <RatesChart data={rates} />
        </>
      )}
    </div>
  );
}
