"use client";

import { Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyFlag } from "@/components/ui/flags";
import { COMPANY_LIMIT_PROGRESS_COLOR } from "@/lib/company/constants";
import { COMPANY_COPY } from "@/lib/company/copy";
import {
  computeLimitUsagePercent,
  formatLimitAmountPtBr,
} from "@/lib/company/format";
import type { CompanyLimitRow, CompanyLimitValue } from "@/lib/company/types";

interface CompanyLimitsTabProps {
  limits: CompanyLimitRow[];
  onOpenReviewModal: () => void;
}

function LimitCell({ cell }: { cell: CompanyLimitValue }) {
  if (cell.max === null) {
    return (
      <td className="px-5 py-4 text-center text-xs text-muted-foreground">
        {COMPANY_COPY.limits.unavailable}
      </td>
    );
  }

  const used = cell.used ?? 0;
  const pct = computeLimitUsagePercent(used, cell.max);
  const unitSuffix = cell.unit ? ` ${cell.unit}` : "";

  return (
    <td className="px-5 py-4">
      <div className="mb-2 text-center font-mono text-xs text-foreground">
        {formatLimitAmountPtBr(used)} / {formatLimitAmountPtBr(cell.max)}
        {unitSuffix}
      </div>
      <div className="flex items-center gap-2.5">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            data-testid="company-limit-progress-bar"
            className="h-full rounded-full transition-[width] duration-200"
            style={{
              width: `${pct}%`,
              backgroundColor: COMPANY_LIMIT_PROGRESS_COLOR,
            }}
          />
        </div>
        <span className="w-9 text-right font-mono text-[11px] text-muted-foreground">
          {pct}%
        </span>
      </div>
    </td>
  );
}

export function CompanyLimitsTab({
  limits,
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
                <th
                  scope="col"
                  className="w-56 px-5 py-3 text-left font-medium"
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
                  </td>
                  <LimitCell cell={row.entry} />
                  <LimitCell cell={row.exit} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
