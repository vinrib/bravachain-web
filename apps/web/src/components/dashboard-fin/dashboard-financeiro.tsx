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
import { getDashboard } from "@/lib/dashboard/api";
import { formatRate } from "@/lib/dashboard/chart";
import {
  PERIODS,
  type DashboardData,
  type DashboardPeriod,
} from "@/lib/dashboard/types";

const CAPTION = "vs. período anterior";

export function DashboardFinanceiro() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    getDashboard(period)
      .then((d) => {
        if (active) setData(d);
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

  const s = data?.summary;
  const hasData =
    !!s &&
    (s.tpvBrl !== null ||
      s.feesPaid !== null ||
      s.withdrawalsTotal !== null ||
      (data?.tpv.length ?? 0) > 0 ||
      (data?.rails.length ?? 0) > 0 ||
      (data?.rates.length ?? 0) > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe volume, câmbio e taxas do período
        </p>
      </div>

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
      ) : !hasData || !s || !data ? (
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KpiCard
              label="Volume recebido (TPV)"
              value={s.tpvBrl !== null ? formatMoney(s.tpvBrl) : "—"}
              variation={s.tpvVariation}
              caption={CAPTION}
            />

            {/* Taxa média de câmbio (USD/EUR) — backend provides one variation. */}
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
                      R$ {formatRate(s.avgRateUsd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">EUR</p>
                    <p className="text-lg font-bold tabular-nums text-foreground">
                      R$ {formatRate(s.avgRateEur)}
                    </p>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <MetricDelta variation={s.avgRateVariation} />
                  <span className="text-xs text-muted-foreground">
                    R$ por unidade · {CAPTION}
                  </span>
                </div>
              </CardContent>
            </Card>

            <KpiCard
              label="Taxas pagas à Bravachain"
              value={s.feesPaid !== null ? formatMoney(s.feesPaid) : "—"}
              variation={s.feesPaidVariation}
              caption={CAPTION}
            />
            <KpiCard
              label="Saques realizados"
              value={s.withdrawalsTotal !== null ? formatMoney(s.withdrawalsTotal) : "—"}
              caption={
                s.withdrawalsCount !== null
                  ? `${s.withdrawalsCount} ${s.withdrawalsCount === 1 ? "saque" : "saques"}`
                  : undefined
              }
            />
          </div>

          <TpvChart data={data.tpv} />
          <RailsChart data={data.rails} />
          <RatesChart data={data.rates} />
        </>
      )}
    </div>
  );
}
