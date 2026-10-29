"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ReviewStatus, RiskLevel } from "@/lib/admin/types";

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

const REVIEW_STYLES: Record<ReviewStatus, string> = {
  NOT_STARTED: "bg-muted text-muted-foreground",
  IN_REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200",
};

export function ReviewStatusChip({ status }: { status: ReviewStatus }) {
  const t = useTranslations("admin.reviewStatus");
  return <Chip className={REVIEW_STYLES[status]}>{t(status)}</Chip>;
}

const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  HIGH: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200",
};

export function RiskChip({ risk }: { risk: RiskLevel | null }) {
  const t = useTranslations("admin.risk");
  if (!risk) return <span className="text-muted-foreground">—</span>;
  return <Chip className={RISK_STYLES[risk]}>{t(risk)}</Chip>;
}

export function KybChip({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  return <Chip className="bg-muted text-foreground">{status}</Chip>;
}

export function PepTag({ isPep }: { isPep: boolean }) {
  const t = useTranslations("admin.common");
  if (!isPep) return <span className="text-muted-foreground">—</span>;
  return (
    <Chip className="bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-200">
      {t("pep")}
    </Chip>
  );
}

export function ExceptionTag({ on }: { on: boolean }) {
  const t = useTranslations("admin.common");
  if (!on) return <span className="text-muted-foreground">—</span>;
  return (
    <Chip className="bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200">
      {t("exceptionActive")}
    </Chip>
  );
}
