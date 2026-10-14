"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionRowSkeleton } from "@/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/components/ui/state";
import { getReceipts } from "@/lib/receipts/api";
import { ReceiptRow } from "./receipt-row";
import { InfoAlert } from "@/components/ui/info-alert";
import { PIX_RETURN_WARNING_SHORT } from "@/lib/pix-warning";
import type { ReceiptsResponse } from "@/lib/receipts/types";

export function ReceiptsView({ embedded }: { embedded?: boolean }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReceiptsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    getReceipts({ page, limit: 20 })
      .then((r) => {
        if (active) setData(r);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os comprovantes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, nonce]);

  const receipts = data?.receipts ?? [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comprovantes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Saques PIX concluídos</p>
        </div>
      )}

      {summary && (
        <Card className="grid grid-cols-2 gap-4 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Sacado (30 dias)</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
              {formatMoney(summary.totalWithdrawn30d)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saques (30 dias)</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
              {summary.withdrawalCount30d}
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
          </>
        ) : error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={() => setNonce((n) => n + 1)} />
          </div>
        ) : receipts.length === 0 ? (
          <EmptyState
            title="Nenhum comprovante"
            description="Comprovantes de saques PIX concluídos aparecem aqui."
            icon={Receipt}
          />
        ) : (
          receipts.map((r) => <ReceiptRow key={r.id} receipt={r} />)
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
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

      <InfoAlert>{PIX_RETURN_WARNING_SHORT}</InfoAlert>
    </div>
  );
}
