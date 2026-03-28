import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted",
        className
      )}
    />
  );
}

/** Pre-built skeleton for a currency balance card */
export function BalanceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/** Pre-built skeleton for a transaction row */
export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="space-y-1.5 text-right">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

/** Pre-built skeleton for the rate chart */
export function ChartSkeleton() {
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="relative h-24 w-full overflow-hidden rounded-lg bg-muted">
        <div className="absolute inset-0 animate-pulse" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
