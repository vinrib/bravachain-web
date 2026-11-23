"use client";

import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { COMPANY_COPY } from "@/lib/company/copy";
import type { CompanyProfile, PepPartner } from "@/lib/company/types";
import { CompanyPepSection } from "./company-pep-section";

interface CompanyProfileTabProps {
  profile: CompanyProfile;
  pepPartners: PepPartner[];
  pepDeclarationAccepted: boolean;
  onTogglePartnerPep: (partnerId: string) => void;
  onChangePepDeclarationAccepted: (accepted: boolean) => void;
}

export function CompanyProfileTab({
  profile,
  pepPartners,
  pepDeclarationAccepted,
  onTogglePartnerPep,
  onChangePepDeclarationAccepted,
}: CompanyProfileTabProps) {
  const fields: Array<{ label: string; value: string; mono?: boolean }> = [
    {
      label: COMPANY_COPY.profile.fields.legalName,
      value: profile.legalName,
    },
    {
      label: COMPANY_COPY.profile.fields.entityType,
      value: profile.entityType,
    },
    {
      label: COMPANY_COPY.profile.fields.cnpj,
      value: profile.cnpj,
      mono: true,
    },
    {
      label: COMPANY_COPY.profile.fields.email,
      value: profile.email,
    },
    {
      label: COMPANY_COPY.profile.fields.phone,
      value: profile.phone,
      mono: true,
    },
    {
      label: COMPANY_COPY.profile.fields.cnae,
      value: profile.cnae,
    },
    {
      label: COMPANY_COPY.profile.fields.address,
      value: profile.address,
    },
  ];

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
              <h2 className="font-sans text-lg font-semibold text-foreground">
                {profile.legalName}
              </h2>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {COMPANY_COPY.page.aveniaStatusPrefix}{" "}
                {profile.aveniaStatusLabel}
              </p>
            </div>
          </div>

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
        </CardContent>
      </Card>

      <CompanyPepSection
        partners={pepPartners}
        declarationAccepted={pepDeclarationAccepted}
        onTogglePartnerPep={onTogglePartnerPep}
        onChangeDeclarationAccepted={onChangePepDeclarationAccepted}
      />
    </div>
  );
}
