"use client";

import { Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyFlag } from "@/components/ui/flags";
import { cn } from "@/lib/utils";
import { COMPANY_LIMIT_PROGRESS_COLOR } from "@/lib/company/constants";
import { COMPANY_COPY } from "@/lib/company/copy";
import {
  computeLimitBarScale,
  formatLimitAmountPtBr,
  formatReferenceMonthPtBr,
  formatUsedPctPtBr,
} from "@/lib/company/format";
import type { CompanyLimitRow, CompanyLimitValue } from "@/lib/company/types";

interface CompanyLimitsTabProps {
  limits: CompanyLimitRow[];
  loading?: boolean;
  error: boolean;
  forbidden?: boolean;
  unavailableReason: string | null;
  onRetry: () => void;
  onOpenReviewModal: () => void;
}

function LimitCell({ cell }: { cell: CompanyLimitValue }) {
  if (cell.max === null) {
    return (
      <td className="px-5 py-4 text-center font-mono text-xs text-muted-foreground">
        —
      </td>
    );
  }

  const usedText = cell.used !== null ? formatLimitAmountPtBr(cell.used) : "—";
  const unitSuffix = cell.unit ? ` ${cell.unit}` : "";
  const pctText = formatUsedPctPtBr(cell.usedPct);
  const barScale = computeLimitBarScale(cell.usedPct);

  return (
    <td className="px-5 py-4">
      <div className="mb-2 text-center font-mono text-xs text-foreground">
        {usedText} / {formatLimitAmountPtBr(cell.max)}
        {unitSuffix}
      </div>

      {pctText !== null && barScale !== null ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "h-1.5 flex-1 overflow-hidden rounded-full bg-muted",
                barScale.exceeded && "ring-1 ring-destructive/50",
              )}
              role="progressbar"
              aria-valuenow={barScale.widthPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={
                barScale.exceeded
                  ? `${pctText} — ${COMPANY_COPY.limits.exceededBadge}`
                  : pctText
              }
            >
              <div
                data-testid="company-limit-progress-bar"
                data-exceeded={barScale.exceeded ? "true" : "false"}
                className={cn(
                  "h-full rounded-full transition-[width] duration-200",
                  barScale.exceeded && "bg-destructive",
                )}
                style={{
                  width: `${barScale.widthPct}%`,
                  ...(barScale.exceeded
                    ? {}
                    : { backgroundColor: COMPANY_LIMIT_PROGRESS_COLOR }),
                }}
              />
            </div>
            <span
              className={cn(
                "min-w-[3.75rem] text-right font-mono text-[11px]",
                barScale.exceeded
                  ? "font-semibold text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {pctText}
            </span>
          </div>
          {barScale.exceeded && (
            <div
              data-testid="company-limit-exceeded-badge"
              className="text-center font-mono text-[10px] font-semibold text-destructive"
            >
              {COMPANY_COPY.limits.exceededBadge}
            </div>
          )}
        </div>
      ) : (
        <div
          data-testid="company-limit-pct-unavailable"
          className="text-center font-mono text-[11px] text-muted-foreground"
        >
          —
        </div>
      )}
    </td>
  );
}

export function CompanyLimitsTab({
  limits,
  loading = false,
  error,
  forbidden = false,
  unavailableReason,
  onRetry,
  onOpenReviewModal,
}: CompanyLimitsTabProps) {
  return (
    <div
      id="company-panel-limites"
      role="tabpanel"
      aria-labelledby="company-tab-limites"
      className="space-y-4"
    >
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="font-sans text-base font-semibold text-foreground">
              {COMPANY_COPY.limits.title}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {COMPANY_COPY.limits.subtitle}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onOpenReviewModal}
          >
            {COMPANY_COPY.limits.reviewAction}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <Card
          data-testid="company-limits-skeleton"
          aria-busy="true"
          aria-label={COMPANY_COPY.limits.loadingLabel}
        >
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : forbidden ? (
        <Card data-testid="company-limits-forbidden">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {COMPANY_COPY.limits.notApproved}
            </p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {COMPANY_COPY.limits.loadError}
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
              {COMPANY_COPY.page.retryAction}
            </Button>
          </CardContent>
        </Card>
      ) : limits.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {unavailableReason ?? COMPANY_COPY.limits.empty}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
                  <th
                    scope="col"
                    className="w-64 px-5 py-3 text-left font-medium"
                  >
                    {COMPANY_COPY.limits.tableHeaders.scope}
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-medium">
                    {COMPANY_COPY.limits.tableHeaders.entry}
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-medium">
                    {COMPANY_COPY.limits.tableHeaders.exit}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {limits.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <div>
                        {row.isGlobal ? (
                          <div className="inline-flex items-center gap-2.5">
                            <Globe
                              className="h-4 w-4 shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span className="rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                              {row.label}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2.5">
                            <CurrencyFlag currency={row.scope} size={22} />
                            <span className="rounded-md bg-foreground px-2.5 py-0.5 font-mono text-xs font-semibold text-background">
                              {row.label}
                            </span>
                          </div>
                        )}
                        {row.unlocked !== false && (
                          <div className="mt-1.5 text-[11px] text-muted-foreground">
                            {formatReferenceMonthPtBr(row.referenceMonth)}
                          </div>
                        )}
                      </div>
                    </td>

                    {row.unlocked === false ? (
                      <td colSpan={2} className="px-5 py-4 text-center">
                        <span className="inline-flex items-center rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                          {COMPANY_COPY.limits.currencyLocked}
                        </span>
                      </td>
                    ) : (
                      <>
                        <LimitCell cell={row.entry} />
                        <LimitCell cell={row.exit} />
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
