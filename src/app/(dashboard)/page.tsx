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
} from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { CURRENCIES } from "@/lib/constants";
import type { WalletData, Transaction, Currency } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BalanceCardSkeleton, TransactionRowSkeleton } from "@/components/ui/skeleton";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { cn } from "@/lib/utils";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatAmount(value: number, currency: Currency) {
  const info = CURRENCIES[currency];
  if (currency === "BRL") return formatBRL(value);
  return `${info.symbol} ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
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
  send: <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />,
  receive: <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />,
  convert: <RefreshCw className="h-3.5 w-3.5 text-blue-500" />,
  deposit: <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />,
};

const MOCK_WALLET: WalletData = {
  total_brl: 12450.0,
  balances: [
    { currency: "BRL", balance: 5000, balance_brl: 5000 },
    { currency: "USDC", balance: 1000, balance_brl: 5120 },
    { currency: "EURC", balance: 200, balance_brl: 1124 },
    { currency: "BRZ", balance: 1206, balance_brl: 1206 },
  ],
};

const MOCK_HISTORY: Transaction[] = [
  { id: "1", type: "receive", amount: 500, currency: "BRL", counterparty: "João Silva", description: "", created_at: new Date().toISOString(), status: "completed" },
  { id: "2", type: "send", amount: 100, currency: "USDC", counterparty: "Maria Costa", description: "", created_at: new Date(Date.now() - 86400000).toISOString(), status: "completed" },
  { id: "3", type: "convert", amount: 500, currency: "BRL", counterparty: "BRL → USDC", description: "", created_at: new Date(Date.now() - 172800000).toISOString(), status: "completed" },
  { id: "4", type: "deposit", amount: 1000, currency: "BRL", counterparty: "Depósito PIX", description: "", created_at: new Date(Date.now() - 345600000).toISOString(), status: "completed" },
];

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
      setHistory(h?.transactions?.slice(0, 6) ?? []);
      setLoading(false);
    });
  }, [router]);

  const displayWallet = wallet ?? MOCK_WALLET;
  const displayHistory = history.length > 0 ? history : MOCK_HISTORY;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Balance Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 sm:p-8">
            <p className="text-sm font-medium text-muted-foreground">Saldo total</p>
            {loading ? (
              <div className="mt-2 h-10 w-48 animate-pulse rounded-lg bg-muted" />
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
              >
                {formatBRL(displayWallet.total_brl)}
              </motion.p>
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
                className="flex flex-col items-center gap-1.5 py-3 sm:py-4 transition-colors hover:bg-muted active:bg-muted/80"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Currency Cards */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Suas moedas</h2>
          <Link
            href="/wallet"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <BalanceCardSkeleton key={i} />
              ))
            : displayWallet.balances.map((b, i) => {
                const info = CURRENCIES[b.currency];
                return (
                  <motion.div
                    key={b.currency}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 + i * 0.07 }}
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <CurrencyIcon currency={b.currency} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {info.name}
                          </p>
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
                              <Button variant="outline" size="sm" className="mt-1.5 h-8 text-xs px-3 min-h-0">
                                PIX
                              </Button>
                            </Link>
                          ) : (
                            <Link href="/send">
                              <Button variant="secondary" size="sm" className="mt-1.5 h-8 text-xs px-3 min-h-0">
                                Enviar
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Atividade recente
          </h2>
          <Link
            href="/historico"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
        >
          <Card>
            {loading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <TransactionRowSkeleton key={i} />
                ))}
              </div>
            ) : displayHistory.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma transação ainda
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {displayHistory.map((tx) => {
                  const isCredit =
                    tx.type === "receive" || tx.type === "deposit";
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 px-4 sm:px-5 py-4"
                    >
                      <div className="relative shrink-0">
                        <CurrencyIcon currency={tx.currency} size="sm" />
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-1 ring-card shadow-sm">
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
                          isCredit ? "text-success" : "text-foreground"
                        )}
                      >
                        {isCredit ? "+" : "-"}
                        {formatAmount(tx.amount, tx.currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
