"use client";

import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { cn } from "@/lib/utils";
import { statementStatusView } from "@/lib/statement/status";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatForeign,
  formatRowDate,
  initials,
  rowTitle,
} from "@/lib/statement/display";
import type { StatementRow } from "@/lib/statement/types";

export function StatementTableRow({
  row,
  onViewReceipts,
}: {
  row: StatementRow;
  onViewReceipts?: () => void;
}) {
  const inbound = row.type === "INBOUND";
  const status = statementStatusView(row.status);
  const { title, sub } = rowTitle(row);
  const { date, time } = formatRowDate(row.createdAt);
  // Incoming amounts are an estimate until the status is final (FX not settled).
  const isEstimate = inbound && !status.final;

  return (
    <div className="grid grid-cols-[1.6fr_0.9fr_1fr_1.1fr_1fr_auto] items-center gap-3 px-4 py-3.5 sm:px-5">
      {/* Contraparte */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {initials(title)}
          </span>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-2 ring-card",
              inbound ? "bg-[#12a46b] text-white" : "bg-[#8a918c] text-white",
            )}
          >
            {inbound ? (
              <ArrowDownLeft className="h-2.5 w-2.5" />
            ) : (
              <ArrowUpRight className="h-2.5 w-2.5" />
            )}
          </span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {sub && (
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          )}
          {row.internalId && (
            <p className="truncate font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {row.internalId}
            </p>
          )}
        </div>
      </div>

      {/* Data */}
      <div className="min-w-0">
        <p className="text-sm text-foreground">{date}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{time}</p>
      </div>

      {/* Moeda */}
      <p className="truncate text-right text-sm text-foreground tabular-nums sm:text-left">
        {formatForeign(row)}
      </p>

      {/* Total (R$) */}
      <div className="text-right">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            inbound ? "text-[#0b6b4f] dark:text-[#7be0b0]" : "text-foreground",
          )}
        >
          {isEstimate ? "≈ " : ""}
          {inbound ? "+ " : "− "}
          {formatMoney(Math.abs(row.amountBrl))}
        </p>
        {isEstimate && (
          <p className="text-[11px] text-muted-foreground">estimativa</p>
        )}
      </div>

      {/* Status */}
      <div className="flex justify-start">
        <StatusBadge label={status.label} tone={status.tone} />
      </div>

      {/* Comprovante shortcut (withdrawals only) */}
      <div className="flex justify-end">
        {!inbound && onViewReceipts ? (
          <button
            type="button"
            onClick={onViewReceipts}
            aria-label="Ver comprovante"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <FileText className="h-4 w-4" />
          </button>
        ) : (
          <span className="h-8 w-8" />
        )}
      </div>
    </div>
  );
}
