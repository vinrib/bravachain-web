"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { CURRENCIES, CURRENCY_LIST, FALLBACK_RATES, FIXED_FEE_BRL, SPREAD_RATE } from "@/lib/constants";
import type { Currency, Transaction, TransactionStatus, TransactionType } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { TransactionRowSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function formatAmount(value: number, currency: Currency) {
  const info = CURRENCIES[currency];
  if (currency === "BRL")
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${info.symbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Mock data (25 transactions) ────────────────────────────

const MOCK_HISTORY: Transaction[] = [
  { id: "t01", type: "deposit", amount: 5000, currency: "BRL", counterparty: "Depósito PIX — Nubank", description: "", created_at: daysAgo(0), status: "completed" },
  { id: "t02", type: "send", amount: 250, currency: "BRL", counterparty: "Ana Lima", description: "Aluguel parte", created_at: daysAgo(1), status: "completed" },
  { id: "t03", type: "receive", amount: 320, currency: "USDC", counterparty: "Carlos Ferreira", description: "Freelance", created_at: daysAgo(1), status: "completed" },
  { id: "t04", type: "convert", amount: 1000, currency: "BRL", counterparty: "BRL → USDC", description: "", created_at: daysAgo(2), status: "completed" },
  { id: "t05", type: "send", amount: 50, currency: "EURC", counterparty: "Maria Oliveira", description: "Reembolso viagem", created_at: daysAgo(3), status: "completed" },
  { id: "t06", type: "deposit", amount: 200, currency: "USDC", counterparty: "Depósito Cripto", description: "", created_at: daysAgo(4), status: "completed" },
  { id: "t07", type: "receive", amount: 800, currency: "BRL", counterparty: "João Silva", description: "Pagamento serviço", created_at: daysAgo(5), status: "completed" },
  { id: "t08", type: "convert", amount: 200, currency: "USDC", counterparty: "USDC → EURC", description: "", created_at: daysAgo(6), status: "completed" },
  { id: "t09", type: "send", amount: 1500, currency: "BRL", counterparty: "Pedro Santos", description: "Investimento conjunto", created_at: daysAgo(7), status: "pending" },
  { id: "t10", type: "receive", amount: 100, currency: "BRZ", counterparty: "Lucas Mendes", description: "", created_at: daysAgo(8), status: "completed" },
  { id: "t11", type: "deposit", amount: 3000, currency: "BRL", counterparty: "Depósito PIX — Inter", description: "", created_at: daysAgo(10), status: "completed" },
  { id: "t12", type: "send", amount: 75, currency: "USDC", counterparty: "Sofia Ramos", description: "Split conta restaurante", created_at: daysAgo(11), status: "completed" },
  { id: "t13", type: "convert", amount: 500, currency: "BRL", counterparty: "BRL → EURC", description: "", created_at: daysAgo(12), status: "completed" },
  { id: "t14", type: "receive", amount: 450, currency: "BRL", counterparty: "Beatriz Costa", description: "Venda produto", created_at: daysAgo(14), status: "completed" },
  { id: "t15", type: "send", amount: 30, currency: "EURC", counterparty: "Felipe Torres", description: "", created_at: daysAgo(15), status: "failed" },
  { id: "t16", type: "deposit", amount: 500, currency: "BRZ", counterparty: "Depósito BRZ", description: "", created_at: daysAgo(16), status: "completed" },
  { id: "t17", type: "receive", amount: 200, currency: "USDC", counterparty: "Rodrigo Nunes", description: "Trabalho remoto", created_at: daysAgo(18), status: "completed" },
  { id: "t18", type: "convert", amount: 1000, currency: "EURC", counterparty: "EURC → BRL", description: "", created_at: daysAgo(20), status: "completed" },
  { id: "t19", type: "send", amount: 200, currency: "BRL", counterparty: "Mariana Souza", description: "Presente aniversário", created_at: daysAgo(22), status: "completed" },
  { id: "t20", type: "receive", amount: 600, currency: "BRL", counterparty: "Rafael Gomes", description: "Serviço design", created_at: daysAgo(24), status: "completed" },
  { id: "t21", type: "deposit", amount: 1000, currency: "BRL", counterparty: "Depósito PIX — C6", description: "", created_at: daysAgo(27), status: "completed" },
  { id: "t22", type: "send", amount: 500, currency: "BRZ", counterparty: "Isabela Alves", description: "Staking reward share", created_at: daysAgo(30), status: "completed" },
  { id: "t23", type: "convert", amount: 300, currency: "BRL", counterparty: "BRL → BRZ", description: "", created_at: daysAgo(35), status: "completed" },
  { id: "t24", type: "receive", amount: 150, currency: "EURC", counterparty: "Daniel Castro", description: "", created_at: daysAgo(40), status: "completed" },
  { id: "t25", type: "send", amount: 100, currency: "USDC", counterparty: "Camila Martins", description: "Reembolso taxa", created_at: daysAgo(45), status: "completed" },
];

// ─── Constants ───────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const TX_TYPE_LABEL: Record<TransactionType, string> = {
  send: "Enviado",
  receive: "Recebido",
  convert: "Conversão",
  deposit: "Depósito",
};

const TX_TYPE_ICON: Record<TransactionType, React.ReactNode> = {
  send: <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />,
  receive: <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />,
  convert: <RefreshCw className="h-3.5 w-3.5 text-blue-500" />,
  deposit: <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />,
};

const STATUS_BADGE: Record<TransactionStatus, { label: string; variant: "success" | "warning" | "destructive" }> = {
  completed: { label: "Concluído", variant: "success" },
  pending: { label: "Pendente", variant: "warning" },
  failed: { label: "Falhou", variant: "destructive" },
};

// ─── CSV Export ──────────────────────────────────────────────

function exportCSV(transactions: Transaction[]) {
  const headers = ["ID", "Tipo", "Valor", "Moeda", "Contraparte", "Data", "Status"];
  const rows = transactions.map((t) => [
    t.id,
    TX_TYPE_LABEL[t.type],
    t.amount.toString().replace(".", ","),
    t.currency,
    `"${t.counterparty.replace(/"/g, '""')}"`,
    new Date(t.created_at).toLocaleString("pt-BR"),
    STATUS_BADGE[t.status].label,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `historico-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Filter bar ──────────────────────────────────────────────

interface Filters {
  search: string;
  currency: Currency | "all";
  type: TransactionType | "all";
  dateFrom: string;
  dateTo: string;
}

const INITIAL_FILTERS: Filters = {
  search: "",
  currency: "all",
  type: "all",
  dateFrom: "",
  dateTo: "",
};

// ─── Page ────────────────────────────────────────────────────

async function handleDownloadReceipt(tx: Transaction) {
  const { downloadReceipt } = await import("@/lib/pdf");
  await downloadReceipt({
    id: tx.id,
    date: tx.created_at,
    senderName: "Usuário Bravachain",
    senderEmail: "usuario@bravachain.com",
    recipientName: tx.counterparty,
    recipientKey: "—",
    amountSent: tx.amount,
    fromCurrency: tx.currency,
    amountReceived: tx.type === "send"
      ? Math.max(0, tx.amount * (1 - SPREAD_RATE) - FIXED_FEE_BRL)
      : tx.amount,
    toCurrency: tx.currency,
    fee: tx.type === "send" ? FIXED_FEE_BRL : 0,
    spread: tx.type === "send" ? tx.amount * SPREAD_RATE : 0,
    exchangeRate: FALLBACK_RATES[`${tx.currency}/${tx.currency}`] ?? 1,
    status: tx.status,
  });
}

export default function HistoricoPage() {
  const [allTx, setAllTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    apiFetch<{ transactions: Transaction[] }>("/v1/wallet/history")
      .then((r) => setAllTx(r.transactions ?? MOCK_HISTORY))
      .catch(() => setAllTx(MOCK_HISTORY))
      .finally(() => setLoading(false));
  }, []);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return allTx.filter((tx) => {
      if (filters.currency !== "all" && tx.currency !== filters.currency)
        return false;
      if (filters.type !== "all" && tx.type !== filters.type) return false;
      if (filters.dateFrom && tx.created_at < new Date(filters.dateFrom).toISOString())
        return false;
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setDate(to.getDate() + 1);
        if (tx.created_at > to.toISOString()) return false;
      }
      if (q) {
        const match =
          tx.counterparty.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q) ||
          tx.currency.toLowerCase().includes(q) ||
          TX_TYPE_LABEL[tx.type].toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allTx, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const hasActiveFilters =
    filters.currency !== "all" ||
    filters.type !== "all" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filtered.length} transaç{filtered.length === 1 ? "ão" : "ões"}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportCSV(filtered)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </Button>
      </motion.div>

      {/* Search + filter row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="space-y-3"
      >
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 h-11 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="search"
              placeholder="Buscar por nome, valor, moeda…"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors shrink-0",
              hasActiveFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
            aria-label="Filtros"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Expandable filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {/* Currency filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Moeda
                    </label>
                    <select
                      value={filters.currency}
                      onChange={(e) =>
                        setFilter("currency", e.target.value as Currency | "all")
                      }
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      <option value="all">Todas</option>
                      {CURRENCY_LIST.map((c) => (
                        <option key={c} value={c}>
                          {CURRENCIES[c].flag} {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tipo
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) =>
                        setFilter("type", e.target.value as TransactionType | "all")
                      }
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      <option value="all">Todos</option>
                      <option value="send">Enviado</option>
                      <option value="receive">Recebido</option>
                      <option value="convert">Conversão</option>
                      <option value="deposit">Depósito</option>
                    </select>
                  </div>

                  {/* Date from */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      De
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilter("dateFrom", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>

                  {/* Date to */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Até
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilter("dateTo", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setFilters(INITIAL_FILTERS);
                      setPage(1);
                    }}
                    className="mt-3 text-xs text-primary hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Transaction list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <TransactionRowSkeleton key={i} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">
                Nenhuma transação encontrada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente outros filtros ou termos de busca
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {paginated.map((tx, i) => {
                  const isCredit = tx.type === "receive" || tx.type === "deposit";
                  const statusConfig = STATUS_BADGE[tx.status];
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/40 transition-colors"
                    >
                      {/* Icon */}
                      <div className="relative shrink-0">
                        <CurrencyIcon currency={tx.currency} size="sm" />
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-1 ring-card shadow-sm">
                          {TX_TYPE_ICON[tx.type]}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {tx.counterparty || TX_TYPE_LABEL[tx.type]}
                          </p>
                          {tx.status !== "completed" && (
                            <Badge variant={statusConfig.variant} className="shrink-0 text-[10px] px-1.5 py-0">
                              {statusConfig.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {TX_TYPE_LABEL[tx.type]} ·{" "}
                          <span className="hidden sm:inline">
                            {formatDateTime(tx.created_at)}
                          </span>
                          <span className="sm:hidden">
                            {new Date(tx.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </p>
                      </div>

                      {/* Amount */}
                      <p
                        className={cn(
                          "text-sm font-semibold shrink-0",
                          isCredit ? "text-success" : "text-foreground"
                        )}
                      >
                        {isCredit ? "+" : "-"}
                        {formatAmount(tx.amount, tx.currency)}
                      </p>

                      {/* Download receipt */}
                      <button
                        onClick={() => handleDownloadReceipt(tx)}
                        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Baixar comprovante"
                        aria-label="Baixar comprovante"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} · {filtered.length} transações
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
