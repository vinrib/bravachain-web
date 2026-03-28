"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Plus,
  ArrowDownLeft,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { CURRENCIES } from "@/lib/constants";
import type { WalletData, Transaction, Currency } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { cn } from "@/lib/utils";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatAmount(value: number, currency: Currency) {
  const info = CURRENCIES[currency];
  if (currency === "BRL") return formatBRL(value);
  return `${info.symbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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

// Skeleton loader
function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

export default function DashboardPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bravachain_token");
    if (!token) { router.replace("/login"); return; }

    Promise.all([
      apiFetch<WalletData>("/v1/wallet").catch(() => null),
      apiFetch<{ transactions: Transaction[] }>("/v1/wallet/history").catch(() => null),
    ]).then(([w, h]) => {
      setWallet(w);
      setHistory(h?.transactions?.slice(0, 8) ?? []);
      setLoading(false);
    });
  }, [router]);

  // Mock data for when API isn't available
  const displayWallet: WalletData = wallet ?? {
    total_brl: 12450.0,
    balances: [
      { currency: "BRL", balance: 5000, balance_brl: 5000 },
      { currency: "USDC", balance: 1000, balance_brl: 5120 },
      { currency: "EURC", balance: 200, balance_brl: 1124 },
      { currency: "BRZ", balance: 1206, balance_brl: 1206 },
    ],
  };

  const displayHistory: Transaction[] = history.length > 0 ? history : [
    { id: "1", type: "receive", amount: 500, currency: "BRL", counterparty: "João Silva", description: "Pagamento", created_at: new Date().toISOString(), status: "completed" },
    { id: "2", type: "send", amount: 100, currency: "USDC", counterparty: "Maria Costa", description: "Reembolso", created_at: new Date(Date.now() - 86400000).toISOString(), status: "completed" },
    { id: "3", type: "convert", amount: 500, currency: "BRL", counterparty: "Conversão BRL→USDC", description: "", created_at: new Date(Date.now() - 172800000).toISOString(), status: "completed" },
    { id: "4", type: "deposit", amount: 1000, currency: "BRL", counterparty: "Depósito PIX", description: "", created_at: new Date(Date.now() - 345600000).toISOString(), status: "completed" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Balance Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 md:p-8">
          <p className="text-sm font-medium text-muted-foreground">Saldo total</p>
          {loading ? (
            <SkeletonLine className="mt-2 h-10 w-48" />
          ) : (
            <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">
              {formatBRL(displayWallet.total_brl)}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Equivalente em BRL</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
          {[
            { label: "Enviar", icon: ArrowUpRight, href: "/send" },
            { label: "Adicionar", icon: Plus, href: "/deposit" },
            { label: "Receber", icon: ArrowDownLeft, href: "/deposit" },
            { label: "Converter", icon: RefreshCw, href: "/convert" },
          ].map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-1.5 py-4 transition-colors hover:bg-muted"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Currency Cards */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Suas moedas</h2>
          <Link href="/wallet" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <SkeletonLine className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLine className="h-4 w-24" />
                      <SkeletonLine className="h-3 w-16" />
                    </div>
                    <SkeletonLine className="h-8 w-16 rounded-lg" />
                  </div>
                </Card>
              ))
            : displayWallet.balances.map((b) => {
                const info = CURRENCIES[b.currency];
                return (
                  <Card key={b.currency} className="p-4">
                    <div className="flex items-center gap-3">
                      <CurrencyIcon currency={b.currency} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{info.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatAmount(b.balance, b.currency)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">
                          {formatBRL(b.balance_brl)}
                        </p>
                        {b.currency === "BRL" ? (
                          <Link href="/deposit">
                            <Button variant="outline" size="sm" className="mt-1.5 h-7 text-xs">
                              PIX
                            </Button>
                          </Link>
                        ) : (
                          <Link href="/send">
                            <Button variant="secondary" size="sm" className="mt-1.5 h-7 text-xs">
                              Enviar
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Atividade recente</h2>
          <Link href="/wallet" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card>
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                  <SkeletonLine className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonLine className="h-4 w-32" />
                    <SkeletonLine className="h-3 w-20" />
                  </div>
                  <SkeletonLine className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : displayHistory.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma transação ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {displayHistory.map((tx) => {
                const isCredit = tx.type === "receive" || tx.type === "deposit";
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-4">
                    {/* Currency icon with type indicator overlay */}
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
                    <p
                      className={cn(
                        "text-sm font-semibold shrink-0",
                        isCredit ? "text-green-600" : "text-foreground"
                      )}
                    >
                      {isCredit ? "+" : "-"}{formatAmount(tx.amount, tx.currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
