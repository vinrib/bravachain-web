"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LineChart as LineChartIcon, Star, ShieldAlert } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TabsPill } from "@/components/ui/tabs-pill";
import { ApiError } from "@/lib/client-api";
import { KpiCard } from "./kpi-card";
import { TpvChart, RailsChart, RatesChart } from "./charts";
import { getDashboard } from "@/lib/dashboard/api";
import { parsePeriodParam, rateOrDash, avgRateDeltaText } from "@/lib/dashboard/chart";
import {
  PERIODS,
  type DashboardData,
  type DashboardPeriod,
} from "@/lib/dashboard/types";

const CAPTION = "vs. período anterior";

function AvgRateDelta({ rate, variation }: { rate: number | null; variation: number | null }) {
  const v = avgRateDeltaText(rate, variation);
  if (!v) return null;
  const cls =
    v.dir > 0 ? "text-success" : v.dir < 0 ? "text-destructive" : "text-muted-foreground";
  return <span className={`text-xs font-medium ${cls}`}>{v.text}</span>;
}

function periodFromUrl(): DashboardPeriod {
  if (typeof window === "undefined") return "30d";
  return parsePeriodParam(new URLSearchParams(window.location.search).get("period"));
}

export function DashboardFinanceiro() {
  const router = useRouter();
  const [period, setPeriodState] = useState<DashboardPeriod>(periodFromUrl);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [nonce, setNonce] = useState(0);

  function setPeriod(p: DashboardPeriod) {
    setPeriodState(p);
    router.replace(`/financeiro?period=${p}`, { scroll: false });
  }

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    setForbidden(false);
    getDashboard(period)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 403) setForbidden(true);
        else setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, nonce]);

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <ShieldAlert className="h-10 w-10 text-[#c77a18]" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Verificação necessária</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Conclua a verificação (KYB) da empresa para ver o dashboard.
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/cadastro">
                Concluir verificação
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <h1 className="font-serif text-[30px] font-bold text-foreground">Dashboard financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe volume, câmbio e taxas do período
        </p>
      </div>

      <TabsPill
        tabs={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
        value={period}
        onChange={setPeriod}
      />

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
              Ainda sem recebimentos no período
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
                    <p className="font-serif text-xl font-bold tabular-nums text-foreground">
                      {rateOrDash(s.avgRateUsd)}
                    </p>
                    {/* Variation (computed from USD) only with a USD rate and a
                        previous period with rate — no "Novo" selo here. */}
                    <AvgRateDelta rate={s.avgRateUsd} variation={s.avgRateVariation} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">EUR</p>
                    <p className="font-serif text-xl font-bold tabular-nums text-foreground">
                      {rateOrDash(s.avgRateEur)}
                    </p>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  R$ por unidade · {CAPTION}
                </p>
              </CardContent>
            </Card>

            {/* "Taxas pagas à Bravachain" (bravaChainRevenue) intentionally
                removed: it is Bravachain's revenue and must be confirmed with
                product before being shown to the client (then as "Tarifas pagas"). */}
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

          <p className="text-xs text-muted-foreground">
            Considera recebimentos internacionais concluídos. Depósitos PIX não entram.
          </p>
        </>
      )}
    </div>
  );
}
