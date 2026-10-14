"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, Receipt, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TransactionRowSkeleton } from "@/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/components/ui/state";
import { cn } from "@/lib/utils";
import { getStatement, statementExportUrl } from "@/lib/statement/api";
import { statementStatusView } from "@/lib/statement/status";
import { formatRate } from "@/lib/dashboard/chart";
import { StatementTableRow } from "./statement-table-row";
import type {
  StatementFilterType,
  StatementQuery,
  StatementResponse,
  StatementRow,
} from "@/lib/statement/types";

export type StatementScope = "andamento" | "historico";

type Period = "30d" | "90d" | "12m";

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "12m", label: "Últimos 12 meses" },
];

const TYPES: Array<{ value: StatementFilterType; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "INBOUND", label: "Entradas" },
  { value: "WITHDRAWAL", label: "Saídas" },
];

const LIMIT = 50;

function periodRange(period: Period): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  if (period === "30d") start.setDate(start.getDate() - 30);
  else if (period === "90d") start.setDate(start.getDate() - 90);
  else start.setFullYear(start.getFullYear() - 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

function matchesSearch(row: StatementRow, q: string): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  return (
    (row.counterparty ?? "").toLowerCase().includes(n) ||
    (row.internalId ?? "").toLowerCase().includes(n) ||
    (row.description ?? "").toLowerCase().includes(n)
  );
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
    <div className="inline-flex rounded-xl border border-border bg-card p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "bg-muted text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A single statement scope (Em andamento | Histórico). Reports per-scope counts
 *  up so the parent tabs can show badges. */
export function StatementView({
  scope,
  onViewReceipts,
  onCounts,
}: {
  scope: StatementScope;
  onViewReceipts?: () => void;
  onCounts?: (counts: { andamento: number; historico: number }) => void;
}) {
  const [period, setPeriod] = useState<Period>("30d");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [type, setType] = useState<StatementFilterType>("ALL");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<StatementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const { startDate, endDate } = periodRange(period);
  const query: StatementQuery = { startDate, endDate, type, limit: LIMIT };

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    getStatement({ startDate, endDate, type, page: 1, limit: LIMIT })
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
  }, [startDate, endDate, type, nonce]);

  const all = useMemo(() => data?.transactions ?? [], [data]);

  // Partition by status into the two tabs (real data; counts are per loaded page).
  const partition = useMemo(() => {
    const andamento: StatementRow[] = [];
    const historico: StatementRow[] = [];
    for (const r of all) {
      (statementStatusView(r.status).final ? historico : andamento).push(r);
    }
    return { andamento, historico };
  }, [all]);

  const andamentoCount = partition.andamento.length;
  const historicoCount = partition.historico.length;
  useEffect(() => {
    onCounts?.({ andamento: andamentoCount, historico: historicoCount });
    // onCounts is a stable setState from the parent; depend only on the numbers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [andamentoCount, historicoCount]);

  const rows = (scope === "historico" ? partition.historico : partition.andamento).filter(
    (r) => matchesSearch(r, search),
  );

  const summary = data?.summary;
  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? "";

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setPeriodOpen((o) => !o)}
            className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground"
          >
            {periodLabel}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {periodOpen && (
            <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setPeriod(p.value);
                    setPeriodOpen(false);
                  }}
                  className={cn(
                    "block w-full px-3.5 py-2 text-left text-sm",
                    p.value === period
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark Export button with CSV/PDF */}
        <div className="flex overflow-hidden rounded-xl bg-[#011a0f] text-white dark:bg-primary dark:text-primary-foreground">
          <span className="flex items-center gap-1.5 pl-3.5 text-sm font-semibold">
            <Download className="h-4 w-4" />
            Exportar
          </span>
          <a
            href={statementExportUrl(query, "csv")}
            download
            className="ml-2 flex items-center px-2.5 text-xs font-medium hover:bg-white/10"
          >
            CSV
          </a>
          <a
            href={statementExportUrl(query, "pdf")}
            download
            className="flex items-center px-3 text-xs font-medium hover:bg-white/10"
          >
            PDF
          </a>
        </div>
      </div>

      {/* Period summary */}
      {summary && (
        <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="mt-0.5 font-serif text-lg font-bold tabular-nums text-[#0b6b4f] dark:text-[#7be0b0]">
              {formatMoneyBRL(summary.totalInbound)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sacado</p>
            <p className="mt-0.5 font-serif text-lg font-bold tabular-nums text-foreground">
              {formatMoneyBRL(summary.totalWithdrawn)}
            </p>
          </div>
          {summary.averageRate > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Taxa média USD/BRL</p>
              <p className="mt-0.5 font-serif text-lg font-bold tabular-nums text-foreground">
                R$ {formatRate(summary.averageRate)}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contraparte ou ID"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <Segmented options={TYPES} value={type} onChange={setType} />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1.6fr_0.9fr_1fr_1.1fr_1fr_auto] gap-3 border-b border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
          <span>Contraparte</span>
          <span>Data</span>
          <span>Moeda</span>
          <span className="text-right">Total (R$)</span>
          <span>Status</span>
          <span />
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <>
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
              title={
                scope === "historico"
                  ? "Nada no histórico"
                  : "Nada em andamento"
              }
              description="Ajuste o período, o tipo ou a busca."
              icon={Receipt}
            />
          ) : (
            rows.map((row) => (
              <StatementTableRow
                key={row.id}
                row={row}
                onViewReceipts={onViewReceipts}
              />
            ))
          )}
        </div>
      </Card>

      {!loading && !error && rows.length > 0 && (
        <p className="text-right text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "lançamento" : "lançamentos"}
        </p>
      )}
    </div>
  );
}

// Local helper to keep comma-decimal BRL formatting consistent.
function formatMoneyBRL(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
