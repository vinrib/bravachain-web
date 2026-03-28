"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { CURRENCIES } from "@/lib/constants";
import type { Currency, Transaction, WalletData } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { cn } from "@/lib/utils";

function formatAmount(value: number, currency: Currency) {
  const info = CURRENCIES[currency];
  if (currency === "BRL") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${info.symbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const txTypeLabel: Record<string, string> = {
  send: "Enviado",
  receive: "Recebido",
  convert: "Conversão",
  deposit: "Depósito",
};

const txTypeIcon = {
  send: <ArrowUpRight className="h-4 w-4 text-red-500" />,
  receive: <ArrowDownLeft className="h-4 w-4 text-green-600" />,
  convert: <RefreshCw className="h-4 w-4 text-blue-500" />,
  deposit: <ArrowDownLeft className="h-4 w-4 text-green-600" />,
};

const mockWallet: WalletData = {
  total_brl: 12450.0,
  balances: [
    { currency: "BRL", balance: 5000, balance_brl: 5000 },
    { currency: "USDC", balance: 1000, balance_brl: 5120 },
    { currency: "EURC", balance: 200, balance_brl: 1124 },
    { currency: "BRZ", balance: 1206, balance_brl: 1206 },
  ],
};

const mockTxs: Transaction[] = [
  { id: "1", type: "receive", amount: 500, currency: "BRL", counterparty: "João Silva", description: "", created_at: new Date().toISOString(), status: "completed" },
  { id: "2", type: "send", amount: 100, currency: "USDC", counterparty: "Maria Costa", description: "", created_at: new Date(Date.now() - 86400000).toISOString(), status: "completed" },
  { id: "3", type: "convert", amount: 500, currency: "BRL", counterparty: "Conversão", description: "", created_at: new Date(Date.now() - 172800000).toISOString(), status: "completed" },
  { id: "4", type: "deposit", amount: 1000, currency: "BRL", counterparty: "Depósito PIX", description: "", created_at: new Date(Date.now() - 345600000).toISOString(), status: "completed" },
  { id: "5", type: "send", amount: 50, currency: "EURC", counterparty: "Carlos Mendes", description: "", created_at: new Date(Date.now() - 604800000).toISOString(), status: "pending" },
];

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCurrency, setFilterCurrency] = useState<Currency | "all">("all");

  useEffect(() => {
    Promise.all([
      apiFetch<WalletData>("/v1/wallet").catch(() => null),
      apiFetch<{ transactions: Transaction[] }>("/v1/wallet/history").catch(() => null),
    ]).then(([w, h]) => {
      setWallet(w ?? mockWallet);
      setHistory(h?.transactions ?? mockTxs);
      setLoading(false);
    });
  }, []);

  const displayWallet = wallet ?? mockWallet;
  const displayHistory = history.length > 0 ? history : mockTxs;

  const filteredTxs = filterCurrency === "all"
    ? displayHistory
    : displayHistory.filter((t) => t.currency === filterCurrency);

  const statusVariant = {
    completed: "success" as const,
    pending: "warning" as const,
    failed: "destructive" as const,
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Carteira</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saldo total: <span className="font-semibold text-foreground">{formatBRL(displayWallet.total_brl)}</span>
        </p>
      </div>

      {/* Currency balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayWallet.balances.map((b) => {
          const info = CURRENCIES[b.currency];
          return (
            <Card key={b.currency} className="p-5">
              <div className="flex items-start gap-3">
                <CurrencyIcon currency={b.currency} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{info.name}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {formatAmount(b.balance, b.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ≈ {formatBRL(b.balance_brl)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Transaction history */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Histórico</h2>
          <div className="flex gap-1.5">
            {(["all", "BRL", "USDC", "EURC", "BRZ"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilterCurrency(c)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  filterCurrency === c
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {c === "all" ? "Todas" : c}
              </button>
            ))}
          </div>
        </div>

        <Card>
          {filteredTxs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTxs.map((tx) => {
                const isCredit = tx.type === "receive" || tx.type === "deposit";
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="relative shrink-0">
                      <CurrencyIcon currency={tx.currency} size="sm" />
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-1 ring-white shadow-sm">
                        {txTypeIcon[tx.type]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.counterparty || txTypeLabel[tx.type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {txTypeLabel[tx.type]} · {formatDate(tx.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-sm font-semibold",
                        isCredit ? "text-green-600" : "text-foreground"
                      )}>
                        {isCredit ? "+" : "-"}{formatAmount(tx.amount, tx.currency)}
                      </p>
                      <Badge variant={statusVariant[tx.status]} className="mt-0.5">
                        {tx.status === "completed" ? "Concluído" : tx.status === "pending" ? "Pendente" : "Falhou"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
