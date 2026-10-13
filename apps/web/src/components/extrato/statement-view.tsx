"use client";

import { useEffect, useState } from "react";
import { Download, Receipt } from "lucide-react";
import { formatMoney, formatDate } from "@bravachain/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionRowSkeleton } from "@/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/components/ui/state";
import { cn } from "@/lib/utils";
import { getStatement, statementExportUrl } from "@/lib/statement/api";
import { StatementRow } from "./statement-row";
import type {
  StatementFilterType,
  StatementQuery,
  StatementResponse,
} from "@/lib/statement/types";

type Period = "30d" | "90d" | "12m";

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "12m", label: "12 meses" },
];

const TYPES: Array<{ value: StatementFilterType; label: string }> = [
  { value: "ALL", label: "Tudo" },
  { value: "INBOUND", label: "Recebimentos" },
  { value: "WITHDRAWAL", label: "Saques" },
];

const LIMIT = 20;

function periodRange(period: Period): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  if (period === "30d") start.setDate(start.getDate() - 30);
  else if (period === "90d") start.setDate(start.getDate() - 90);
  else start.setFullYear(start.getFullYear() - 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StatementView({
  embedded,
  onViewReceipts,
}: {
  embedded?: boolean;
  onViewReceipts?: () => void;
} = {}) {
  const [period, setPeriod] = useState<Period>("30d");
  const [type, setType] = useState<StatementFilterType>("ALL");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StatementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const { startDate, endDate } = periodRange(period);
  const query: StatementQuery = { startDate, endDate, type, page, limit: LIMIT };

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    getStatement({ startDate, endDate, type, page, limit: LIMIT })
      .then((r) => {
        if (active) setData(r);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar o extrato.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [startDate, endDate, type, page, nonce]);

  // Reset to page 1 whenever the filters change.
  function changePeriod(p: Period) {
    setPeriod(p);
    setPage(1);
  }
  function changeType(t: StatementFilterType) {
    setType(t);
    setPage(1);
  }

  const rows = data?.transactions ?? [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  return (
    <div className={cn("space-y-6", !embedded && "mx-auto max-w-2xl")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        {embedded ? (
          <span />
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-foreground">Extrato</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Todas as movimentações da conta
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm" className="gap-2">
            <a href={statementExportUrl(query, "csv")} download>
              <Download className="h-4 w-4" />
              CSV
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm" className="gap-2">
            <a href={statementExportUrl(query, "pdf")} download>
              <Download className="h-4 w-4" />
              PDF
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Segmented options={PERIODS} value={period} onChange={changePeriod} />
        <Segmented options={TYPES} value={type} onChange={changeType} />
      </div>

      {summary && (
        <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-success">
              {formatMoney(summary.totalInbound)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sacado</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
              {formatMoney(summary.totalWithdrawn)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa média</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
              {summary.averageRate > 0
                ? summary.averageRate.toLocaleString("pt-BR", {
                    maximumFractionDigits: 4,
                  })
                : "—"}
            </p>
          </div>
        </Card>
      )}

      <Card className="divide-y divide-border overflow-hidden">
        {loading ? (
          <>
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
          </>
        ) : error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={() => setNonce((n) => n + 1)} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhuma movimentação"
            description="Ajuste o período ou o tipo para ver mais."
            icon={Receipt}
          />
        ) : (
          rows.map((row) => (
            <StatementRow key={row.id} row={row} onViewReceipts={onViewReceipts} />
          ))
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
            {summary && ` · ${formatDate(summary.periodStart)}–${formatDate(summary.periodEnd)}`}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={loading || page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
