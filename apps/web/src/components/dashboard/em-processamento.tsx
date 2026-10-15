"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { Card, CardContent } from "@/components/ui/card";
import { getStatement } from "@/lib/statement/api";
import { statementStatusView } from "@/lib/statement/status";
import type { StatementRow } from "@/lib/statement/types";

/** Sidebar panel: in-progress receivings from /v1/statement (real data). */
export function EmProcessamento() {
  const [rows, setRows] = useState<StatementRow[] | null>(null);

  useEffect(() => {
    let active = true;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    getStatement({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      type: "INBOUND",
      page: 1,
      limit: 20,
    })
      .then((r) => {
        if (active) {
          setRows(r.transactions.filter((t) => !statementStatusView(t.status).final));
        }
      })
      .catch(() => {
        if (active) setRows([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Don't render until we know, and hide when there's nothing in progress.
  if (!rows || rows.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#c77a18]" />
          <p className="text-sm font-semibold text-foreground">Em processamento</p>
        </div>
        <ul className="space-y-3">
          {rows.slice(0, 4).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm text-foreground">
                {r.counterparty || "Recebimento"}
              </span>
              <span className="shrink-0 text-sm font-medium tabular-nums text-[#0b6b4f] dark:text-[#7be0b0]">
                ≈ {formatMoney(r.amountBrl)}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/extrato"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Ver no extrato
        </Link>
      </CardContent>
    </Card>
  );
}
