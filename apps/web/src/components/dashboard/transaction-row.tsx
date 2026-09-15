import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatMoney, formatDateTime } from "@bravachain/shared";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/models";

export function TransactionRow({ tx }: { tx: Transaction }) {
  const isIn = tx.direction === "in";

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isIn ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
        )}
      >
        {isIn ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{tx.description}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
      </div>

      <p
        className={cn(
          "text-right text-sm font-semibold tabular-nums",
          isIn ? "text-success" : "text-foreground",
        )}
      >
        {isIn ? "+" : "−"}
        {formatMoney(tx.amount, { currency: tx.currency })}
      </p>
    </div>
  );
}
