"use client";

import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { formatMoney, formatDateTime } from "@bravachain/shared";
import { cn } from "@/lib/utils";
import { WithdrawBreakdown } from "./withdraw-breakdown";
import type { StatementRow as Row } from "@/lib/statement/types";

export function StatementRow({
  row,
  onViewReceipts,
}: {
  row: Row;
  onViewReceipts?: () => void;
}) {
  const inbound = row.type === "INBOUND";
  const Icon = inbound ? ArrowDownLeft : ArrowUpRight;
  // Shortcut to the Comprovantes tab (only for withdrawals, when enabled).
  const showReceiptShortcut = !inbound && typeof onViewReceipts === "function";

  // Foreign amount sub-line (INBOUND only, when provided).
  const foreign =
    inbound && row.amountForeign !== null && row.foreignCurrency
      ? `${row.foreignCurrency} ${row.amountForeign.toLocaleString("pt-BR")}` +
        (row.rateApplied !== null ? ` · taxa ${row.rateApplied}` : "")
      : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          inbound ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {row.description || (inbound ? "Recebimento" : "Saque")}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[row.counterparty, formatDateTime(row.createdAt)].filter(Boolean).join(" · ")}
        </p>
        {showReceiptShortcut && (
          <button
            type="button"
            onClick={onViewReceipts}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <FileText className="h-3 w-3" />
            Comprovante
          </button>
        )}
        {!inbound && (
          <div className="mt-1">
            <WithdrawBreakdown gross={row.amountBrl} fee={row.feeBrl} net={row.netAmountBrl} />
          </div>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            inbound ? "text-success" : "text-foreground",
          )}
        >
          {inbound ? "+" : "−"}
          {formatMoney(Math.abs(row.amountBrl))}
        </p>
        {foreign && <p className="text-xs text-muted-foreground">{foreign}</p>}
        {row.status && row.status !== "COMPLETED" && (
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {row.status}
          </p>
        )}
      </div>
    </div>
  );
}
