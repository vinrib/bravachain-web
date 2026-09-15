"use client";

import Link from "next/link";
import { Banknote, Receipt, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { formatMoney } from "@bravachain/shared";
import { useBalance, useTransactions, useKycState } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, TransactionRowSkeleton } from "@/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/components/ui/state";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { KycBanner } from "@/components/dashboard/kyc-banner";

export default function DashboardPage() {
  const balance = useBalance();
  const transactions = useTransactions();
  const kyc = useKycState();
  const [hidden, setHidden] = useState(false);

  const recent = transactions.data?.slice(0, 5) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Início</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe o saldo e as movimentações da cooperativa
        </p>
      </div>

      {kyc.data && <KycBanner status={kyc.data.status} />}

      {/* Saldo */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          {balance.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-48" />
            </div>
          ) : balance.error ? (
            <ErrorState message={balance.error} onRetry={balance.reload} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Saldo disponível</p>
                <button
                  onClick={() => setHidden((h) => !h)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={hidden ? "Mostrar saldo" : "Ocultar saldo"}
                >
                  {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                {hidden
                  ? "••••••"
                  : formatMoney(balance.data?.available ?? 0, {
                      currency: balance.data?.currency ?? "BRL",
                    })}
              </p>

              <div className="mt-5 flex gap-3">
                <Button asChild size="lg" className="flex-1 gap-2">
                  <Link href="/saque">
                    <Banknote className="h-4 w-4" />
                    Sacar via PIX
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="flex-1 gap-2">
                  <Link href="/extrato">
                    <Receipt className="h-4 w-4" />
                    Ver extrato
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Extrato recente */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-base font-semibold text-foreground">Movimentações recentes</h2>
          <Link href="/extrato" className="text-sm font-medium text-primary hover:underline">
            Ver tudo
          </Link>
        </div>

        <Card className="divide-y divide-border overflow-hidden">
          {transactions.loading ? (
            <>
              <TransactionRowSkeleton />
              <TransactionRowSkeleton />
              <TransactionRowSkeleton />
            </>
          ) : transactions.error ? (
            <div className="p-4">
              <ErrorState message={transactions.error} onRetry={transactions.reload} />
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              title="Nenhuma movimentação ainda"
              description="Os créditos das suas exportações aparecerão aqui."
              icon={Receipt}
            />
          ) : (
            recent.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </Card>
      </div>
    </div>
  );
}
