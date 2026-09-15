import Link from "next/link";
import type { KycStatus } from "@bravachain/shared";
import { kycStatusMeta } from "@/components/kyc/status-meta";
import { cn } from "@/lib/utils";

/**
 * Compact verification prompt for the dashboard. Renders nothing when the
 * cooperative is already approved.
 */
export function KycBanner({ status }: { status: KycStatus }) {
  if (status === "approved") return null;
  const meta = kycStatusMeta[status];
  const isProblem = status === "rejected";

  return (
    <Link
      href="/cadastro"
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
        isProblem
          ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
          : "border-primary/30 bg-primary/5 hover:bg-primary/10",
      )}
    >
      <meta.Icon
        className={cn("h-5 w-5 shrink-0", isProblem ? "text-destructive" : "text-primary")}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{meta.title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta.description}</p>
      </div>
      <span className={cn("text-sm font-medium", isProblem ? "text-destructive" : "text-primary")}>
        Ver →
      </span>
    </Link>
  );
}
