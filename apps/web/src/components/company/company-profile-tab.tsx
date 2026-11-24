"use client";

import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMPANY_COPY } from "@/lib/company/copy";
import type { CompanyProfile, PepPartner } from "@/lib/company/types";
import { CompanyPepSection } from "./company-pep-section";

interface CompanyProfileTabProps {
  profile: CompanyProfile | null;
  error: boolean;
  onRetry: () => void;
  showPepSection: boolean;
  pepPartners: PepPartner[];
  pepDeclarationAccepted: boolean;
  onTogglePartnerPep: (partnerId: string) => void;
  onChangePepDeclarationAccepted: (accepted: boolean) => void;
}

export function CompanyProfileTab({
  profile,
  error,
  onRetry,
  showPepSection,
  pepPartners,
  pepDeclarationAccepted,
  onTogglePartnerPep,
  onChangePepDeclarationAccepted,
}: CompanyProfileTabProps) {
  if (error || !profile) {
    return (
      <div
        id="company-panel-perfil"
        role="tabpanel"
        aria-labelledby="company-tab-perfil"
      >
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {COMPANY_COPY.profile.loadError}
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
              {COMPANY_COPY.page.retryAction}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fields: Array<{ label: string; value: string; mono?: boolean }> = [];
  if (profile.legalName) {
    fields.push({
      label: COMPANY_COPY.profile.fields.legalName,
      value: profile.legalName,
    });
  }
  if (profile.cnpj) {
    fields.push({
      label: COMPANY_COPY.profile.fields.cnpj,
      value: profile.cnpj,
      mono: true,
    });
  }
  if (profile.email) {
    fields.push({
      label: COMPANY_COPY.profile.fields.email,
      value: profile.email,
    });
  }
  if (profile.cnae) {
    fields.push({
      label: COMPANY_COPY.profile.fields.cnae,
      value: profile.cnae,
    });
  }

  const headingText = profile.legalName ?? profile.displayName ?? null;
  const statusSubtitle =
    profile.aveniaStatusKind === "unavailable"
      ? profile.aveniaStatusLabel
      : `${COMPANY_COPY.page.aveniaStatusPrefix} ${profile.aveniaStatusLabel}`;

  return (
    <div
      id="company-panel-perfil"
      role="tabpanel"
      aria-labelledby="company-tab-perfil"
      className="space-y-6"
    >
      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              {headingText && (
                <h2 className="font-sans text-lg font-semibold text-foreground">
                  {headingText}
                </h2>
              )}
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {statusSubtitle}
              </p>
            </div>
          </div>

          {fields.length > 0 ? (
            <dl
              aria-label={COMPANY_COPY.profile.sectionLabel}
              className="grid grid-cols-1 gap-5 border-t border-border pt-5 md:grid-cols-2"
            >
              {fields.map((field) => (
                <div key={field.label} className="space-y-1">
                  <dt className="text-xs font-semibold text-foreground">
                    {field.label}
                  </dt>
                  <dd
                    className={cn(
                      "text-sm text-muted-foreground",
                      field.mono && "font-mono",
                    )}
                  >
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="border-t border-border pt-5 text-sm text-muted-foreground">
              {COMPANY_COPY.profile.empty}
            </p>
          )}
        </CardContent>
      </Card>

      {showPepSection && (
        <CompanyPepSection
          partners={pepPartners}
          declarationAccepted={pepDeclarationAccepted}
          onTogglePartnerPep={onTogglePartnerPep}
          onChangeDeclarationAccepted={onChangePepDeclarationAccepted}
        />
      )}
    </div>
  );
}
