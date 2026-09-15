"use client";

import { useState } from "react";
import { Download, Receipt } from "lucide-react";
import { useTransactions } from "@/lib/hooks";
import { downloadExtrato } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TransactionRowSkeleton } from "@/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/components/ui/state";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { useToast } from "@/components/toast-provider";

export default function ExtratoPage() {
  const { data, loading, error, reload } = useTransactions();
  const { error: toastError } = useToast();
  const [exporting, setExporting] = useState(false);

  const transactions = data ?? [];

  async function handleExport() {
    if (transactions.length === 0) return;
    setExporting(true);
    try {
      await downloadExtrato({ transactions });
    } catch {
      toastError("Não foi possível gerar o PDF", "Tente novamente em instantes.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Extrato</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todas as movimentações da conta
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={handleExport}
          disabled={exporting || transactions.length === 0}
        >
          <Download className="h-4 w-4" />
          {exporting ? "Gerando…" : "Exportar PDF"}
        </Button>
      </div>

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
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="Nenhuma movimentação"
            description="Quando houver créditos ou saques, eles aparecerão aqui."
            icon={Receipt}
          />
        ) : (
          transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </Card>
    </div>
  );
}
