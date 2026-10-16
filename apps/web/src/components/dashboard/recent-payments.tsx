"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TransactionRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStatement } from "@/lib/statement/api";
import { statementStatusView } from "@/lib/statement/status";
import { formatForeign, initials, rowTitle, formatRowDate } from "@/lib/statement/display";
import type { StatementRow } from "@/lib/statement/types";

/** "Pagamentos recentes" on Início — latest rows from /v1/statement (real data). */
export function RecentPayments() {
  const [rows, setRows] = useState<StatementRow[] | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(false);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    getStatement({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      type: "ALL",
      page: 1,
      limit: 5,
    })
      .then((r) => {
        if (active) setRows(r.transactions);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [nonce]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-foreground">Pagamentos recentes</h2>
        <Link href="/extrato" className="text-sm font-medium text-primary hover:underline">
          Ver extrato
        </Link>
      </div>

      <Card className="divide-y divide-border overflow-hidden">
        {rows === null && !error ? (
          <>
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
          </>
        ) : error ? (
          <div className="p-4">
            <ErrorState message="Não foi possível carregar." onRetry={() => setNonce((n) => n + 1)} />
          </div>
        ) : rows && rows.length === 0 ? (
          <EmptyState
            title="Nenhuma movimentação ainda"
            description="Os créditos das suas exportações aparecerão aqui."
            icon={Receipt}
          />
        ) : (
          rows!.map((row) => {
            const inbound = row.type === "INBOUND";
            const status = statementStatusView(row.status);
            const { title } = rowTitle(row);
            const { date } = formatRowDate(row.createdAt);
            return (
              <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    inbound ? "bg-[#12a46b]/10 text-[#0b6b4f]" : "bg-muted text-muted-foreground",
                  )}
                >
                  {inbound ? initials(title) : <ArrowUpRight className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[inbound ? formatForeign(row) : null, date].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      inbound ? "text-[#0b6b4f] dark:text-[#7be0b0]" : "text-foreground",
                    )}
                  >
                    {inbound ? "+ " : "− "}
                    {formatMoney(Math.abs(row.amountBrl))}
                  </p>
                  <div className="mt-0.5 flex justify-end">
                    <StatusBadge label={status.label} tone={status.tone} />
                  </div>
                </div>
                <span className="shrink-0 text-muted-foreground">
                  {inbound ? <ArrowDownLeft className="h-4 w-4 text-[#12a46b]" /> : null}
                </span>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
