"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { formatMoney, formatDateTime } from "@bravachain/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getReceipts, receiptPdfUrl } from "@/lib/receipts/api";
import type { ReceiptListItem } from "@/lib/receipts/types";

/**
 * "Histórico de pagamentos" sidebar for the Saque screen — completed PIX
 * withdrawals (GET /v1/receipts). Tarifa/líquido live in the comprovante (PDF).
 */
export function WithdrawHistory() {
  const [items, setItems] = useState<ReceiptListItem[] | null>(null);

  useEffect(() => {
    let active = true;
    getReceipts({ page: 1, limit: 8 })
      .then((r) => {
        if (active) setItems(r.receipts);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Histórico de pagamentos
        </p>

        {items === null ? (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Nenhum pagamento ainda. Quando você fizer um saque, ele aparece aqui.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((r) => (
              <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatMoney(r.amountBrl)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[r.bankName, formatDateTime(r.pixSentAt || r.createdAt)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <a
                  href={receiptPdfUrl(r.id)}
                  download
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  Ver comprovante
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
