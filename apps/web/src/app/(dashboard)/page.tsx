"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { useTransactions, useKycState } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { TransactionRowSkeleton } from "@/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/components/ui/state";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { KycBanner } from "@/components/dashboard/kyc-banner";
import { ReceiveCurrencyCards } from "@/components/dashboard/receive-currency-cards";
import { WelcomeBalanceCard } from "@/components/dashboard/welcome-balance-card";
import { EmProcessamento } from "@/components/dashboard/em-processamento";
import { SaqueRapido } from "@/components/dashboard/saque-rapido";

export default function DashboardPage() {
  const transactions = useTransactions();
  const kyc = useKycState();
  const recent = transactions.data?.slice(0, 5) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Início</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe o saldo e as movimentações da sua empresa
        </p>
      </div>

      {kyc.data && <KycBanner status={kyc.data.status} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="space-y-6">
          <WelcomeBalanceCard />

          {/* Minhas contas (USD/EUR receiving instructions — never a balance) */}
          <ReceiveCurrencyCards />

          {/* Pagamentos recentes */}
          <div>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-base font-semibold text-foreground">
                Pagamentos recentes
              </h2>
              <Link
                href="/extrato"
                className="text-sm font-medium text-primary hover:underline"
              >
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

        {/* Side column */}
        <aside className="space-y-6">
          <EmProcessamento />
          <SaqueRapido />
        </aside>
      </div>
    </div>
  );
}
