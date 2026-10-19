"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/state";
import { CurrencyFlag } from "@/components/ui/flags";
import { cn } from "@/lib/utils";
import { PAIRS, type LiveRate, type LiveRates } from "@/lib/rates/types";

export function formatRate4(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function updatedLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // Date + time: a reference rate can be a day or two old, so showing only the
  // time would make a stale quote look fresh.
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Change({ rate }: { rate: LiveRate }) {
  // "static" source is treated as unavailable → no variation shown.
  if (rate.source === "static" || rate.change24h === null) return null;
  const dir = rate.changeDirection;
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  const pct = Math.abs(rate.change24h);
  const text = `${dir === "up" ? "+" : dir === "down" ? "−" : ""}${pct.toFixed(2)}%`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        dir === "up" && "text-[#0b6b4f] dark:text-[#7be0b0]",
        dir === "down" && "text-[#b03030]",
        dir === "stable" && "text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {text} <span className="text-muted-foreground">24h</span>
    </span>
  );
}

function LiveCard({ pair, rate }: { pair: (typeof PAIRS)[number]; rate: LiveRate | null }) {
  const updated = rate ? updatedLabel(rate.updatedAt) : null;
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2">
          <CurrencyFlag currency={pair.currency} size={28} />
          <span className="text-sm font-semibold text-foreground">{pair.label}</span>
        </div>
        <p className="mt-2 font-serif text-3xl font-bold tabular-nums text-foreground">
          R$ {formatRate4(rate?.rate ?? null)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {rate && <Change rate={rate} />}
        </div>
        {updated && (
          <p className="mt-1.5 text-xs text-muted-foreground">Atualizado em {updated}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function RatesLiveCards({
  data,
  loading,
  error,
  onRetry,
}: {
  data: LiveRates | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const fallback =
    data?.USD_BRL?.isFallback || data?.EUR_BRL?.isFallback;

  if (error) {
    return <ErrorState message="Não foi possível carregar as cotações." onRetry={onRetry} />;
  }

  return (
    <div className="space-y-3">
      {fallback && (
        <div className="flex items-start gap-2 rounded-xl bg-[#c77a18]/10 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#c77a18]" />
          <p className="text-sm text-[#8a5310] dark:text-[#d79a3a]">
            Cotação temporariamente indisponível. Exibindo o último valor conhecido.
          </p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {loading ? (
          <>
            <Card><CardContent className="pt-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
            <Card><CardContent className="pt-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
          </>
        ) : (
          PAIRS.map((p) => (
            <LiveCard key={p.value} pair={p} rate={data?.[p.value] ?? null} />
          ))
        )}
      </div>
    </div>
  );
}
