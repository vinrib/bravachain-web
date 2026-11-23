"use client";

import { AlertCircle, CheckCircle2, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { COMPANY_COPY } from "@/lib/company/copy";
import type { PepPartner } from "@/lib/company/types";

interface CompanyPepSectionProps {
  partners: PepPartner[];
  declarationAccepted: boolean;
  onTogglePartnerPep: (partnerId: string) => void;
  onChangeDeclarationAccepted: (accepted: boolean) => void;
}

export function CompanyPepSection({
  partners,
  declarationAccepted,
  onTogglePartnerPep,
  onChangeDeclarationAccepted,
}: CompanyPepSectionProps) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
            <UserCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-sans text-base font-semibold text-foreground">
              {COMPANY_COPY.pep.title}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {COMPANY_COPY.pep.subtitle}
            </p>
          </div>
        </div>

        {partners.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            {COMPANY_COPY.pep.empty}
          </p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex flex-col justify-between gap-4 bg-muted/40 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {partner.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {partner.cpfMasked}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {partner.ownership} • {partner.role}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {partner.isPep ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-1 font-mono text-[11px] font-medium text-warning">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {COMPANY_COPY.pep.statusIsPep}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-2.5 py-1 font-mono text-[11px] font-medium text-success">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {COMPANY_COPY.pep.statusNotPep}
                    </span>
                  )}

                  <button
                    type="button"
                    aria-pressed={partner.isPep}
                    onClick={() => onTogglePartnerPep(partner.id)}
                    className={cn(
                      "min-h-[36px] rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    {COMPANY_COPY.pep.togglePrefix}{" "}
                    <strong>
                      {partner.isPep
                        ? COMPANY_COPY.pep.yes
                        : COMPANY_COPY.pep.no}
                    </strong>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TODO-ADVOGADO: texto da declaração */}
        <label
          htmlFor="company-pep-declaration"
          className="flex cursor-pointer items-start gap-2.5 pt-1 text-xs leading-relaxed text-muted-foreground select-none"
        >
          <input
            id="company-pep-declaration"
            type="checkbox"
            checked={declarationAccepted}
            onChange={(e) => onChangeDeclarationAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded accent-foreground"
          />
          <span>{COMPANY_COPY.pep.declarationCheckbox}</span>
        </label>
      </CardContent>
    </Card>
  );
}
