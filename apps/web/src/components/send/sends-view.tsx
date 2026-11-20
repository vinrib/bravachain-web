"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { formatMoney } from "@bravachain/shared";
import { ChevronRight, Send } from "lucide-react";
import { CurrencyFlag } from "@/components/ui/flags";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getSends } from "@/lib/send/api";
import type { SendCurrency, SendListItem, SendStatus } from "@/lib/send/types";
import { SendReceipt } from "./send-receipt";

const RAIL: Record<SendCurrency, string> = { BRL: "Pix", USD: "Wire", EUR: "SEPA" };

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: SendListItem[] };

/** Status badge tone for a send, reusing the enviar.status.badge* labels. */
export function sendStatusBadge(
  status: SendStatus,
  t: ReturnType<typeof useTranslations>,
): { label: string; className: string } {
  switch (status) {
    case "concluido":
      return { label: t("status.badgeDone"), className: "bg-primary/10 text-primary" };
    case "recusado":
      return { label: t("status.badgeRefused"), className: "bg-destructive/10 text-destructive" };
    case "falha":
      return { label: t("status.badgeFailed"), className: "bg-warning/10 text-warning" };
    default:
      return { label: t("status.badgeProcessing"), className: "bg-muted text-foreground/80" };
  }
}

/** Extrato "Envios" filter: list of sends + inline receipt detail. */
export function SendsView() {
  const t = useTranslations("enviar");
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSends()
      .then((items) => active && setState({ status: "ready", items }))
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
    };
  }, []);

  function reload() {
    setState({ status: "loading" });
    getSends()
      .then((items) => setState({ status: "ready", items }))
      .catch(() => setState({ status: "error" }));
  }

  if (selected) return <SendReceipt id={selected} onBack={() => setSelected(null)} />;
  if (state.status === "error") return <ErrorState message={t("statement.loadError")} onRetry={reload} />;

  if (state.status === "loading") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flex items-center gap-3.5 px-4.5 py-3.5 ${i ? "border-t border-border" : ""}`}>
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (state.items.length === 0) {
    return <EmptyState icon={Send} title={t("statement.empty")} description={t("statement.emptyDesc")} />;
  }

  return (
    <div className="space-y-3">
      <ul className="overflow-hidden rounded-2xl border border-border bg-card">
        {state.items.map((item, i) => {
          const badge = sendStatusBadge(item.status, t);
          const second =
            item.receiveAmount !== null ? formatMoney(item.receiveAmount, { currency: item.currency }) : RAIL[item.currency];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelected(item.id)}
                className={`flex w-full items-center gap-3.5 px-4.5 py-3.5 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 ${i ? "border-t border-border" : ""}`}
              >
                <CurrencyFlag currency={item.currency} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold">{item.beneficiaryName}</div>
                  <div className="text-[12.5px] text-muted-foreground">
                    {t("statement.sendLine", { currency: item.currency, date: item.createdAt })}
                  </div>
                </div>
                <span className="hidden w-[150px] shrink-0 sm:block">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge.className}`}>{badge.label}</span>
                </span>
                <div className="shrink-0 text-right">
                  <div className="text-[14.5px] font-semibold tabular-nums">− {formatMoney(item.amountBrl, { currency: "BRL" })}</div>
                  <div className="text-xs tabular-nums text-muted-foreground">{second}</div>
                  <div className="mt-1 sm:hidden">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.className}`}>{badge.label}</span>
                  </div>
                </div>
                <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{t("statement.exampleNote")}</p>
    </div>
  );
}
