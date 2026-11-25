"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { COMPANY_TABS, type CompanyTab } from "@/lib/company/constants";
import { COMPANY_COPY } from "@/lib/company/copy";
import type { AveniaStatusKind } from "@/lib/company/types";

interface CompanyHeaderProps {
  aveniaStatusKind: AveniaStatusKind;
  aveniaStatusLabel: string;
  statusLoading?: boolean;
  activeTab: CompanyTab;
  onSelectTab: (tab: CompanyTab) => void;
  pendingCount: number;
}

const STATUS_BADGE_CLASSES: Record<AveniaStatusKind, string> = {
  approved: "bg-success/10 text-success ring-1 ring-inset ring-success/25",
  in_analysis: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/25",
  pending: "bg-muted text-foreground ring-1 ring-inset ring-border",
  unavailable: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
};

export function CompanyHeader({
  aveniaStatusKind,
  aveniaStatusLabel,
  statusLoading = false,
  activeTab,
  onSelectTab,
  pendingCount,
}: CompanyHeaderProps) {
  const badgeText =
    aveniaStatusKind === "unavailable"
      ? aveniaStatusLabel
      : `${COMPANY_COPY.page.aveniaStatusPrefix} ${aveniaStatusLabel}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-[30px] font-bold tracking-tight text-foreground">
            {COMPANY_COPY.page.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {COMPANY_COPY.page.subtitle}
          </p>
        </div>

        {statusLoading ? (
          <Skeleton className="h-7 w-56 rounded-xl" aria-hidden="true" />
        ) : (
          <span
            data-testid="company-avenia-status-badge"
            className={cn(
              "inline-flex items-center rounded-xl px-3 py-1.5 font-mono text-xs font-medium",
              STATUS_BADGE_CLASSES[aveniaStatusKind],
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div
        role="tablist"
        aria-label={COMPANY_COPY.page.title}
        className="flex items-center gap-6 overflow-x-auto border-b border-border"
      >
        {COMPANY_TABS.map((tabId) => {
          const isActive = activeTab === tabId;
          const label = COMPANY_COPY.tabs[tabId];
          const showBadge = tabId === "pendencias" && pendingCount > 0;

          return (
            <button
              key={tabId}
              id={`company-tab-${tabId}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`company-panel-${tabId}`}
              onClick={() => onSelectTab(tabId)}
              className={cn(
                "relative flex min-h-[44px] items-center gap-2 whitespace-nowrap pb-3 pt-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{label}</span>
              {showBadge && (
                <span
                  data-testid="company-pending-counter"
                  className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-warning/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-warning"
                >
                  {pendingCount}
                </span>
              )}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-foreground"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
