"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toast-provider";
import { featureFlags } from "@/lib/feature-flags";
import type { CompanyTab } from "@/lib/company/constants";
import { COMPANY_COPY } from "@/lib/company/copy";
import { useCompanyData } from "@/lib/company/hooks";
import type { CompanyDocument } from "@/lib/company/types";
import { CompanyDocumentsTab } from "./company-documents-tab";
import { CompanyHeader } from "./company-header";
import { CompanyLimitsModal } from "./company-limits-modal";
import { CompanyLimitsTab } from "./company-limits-tab";
import { CompanyPendingTab } from "./company-pending-tab";
import { CompanyProfileTab } from "./company-profile-tab";

interface CompanyViewProps {
  /** Overrides `featureFlags.empresaPep` in tests; defaults to the build-time flag (OFF). */
  showPepSection?: boolean;
}

export function CompanyView({
  showPepSection = featureFlags.empresaPep,
}: CompanyViewProps = {}) {
  const [activeTab, setActiveTab] = useState<CompanyTab>("perfil");
  const [limitsModalOpen, setLimitsModalOpen] = useState(false);
  const { success } = useToast();

  const {
    data,
    loading,
    error,
    reload,
    pendingDocuments,
    uploadingDocId,
    uploadError,
    pepDeclarationAccepted,
    setPepDeclarationAccepted,
    togglePartnerPep,
    handleUploadDocument,
  } = useCompanyData();

  async function onUploadFile(doc: CompanyDocument, file: File) {
    const ok = await handleUploadDocument(doc, file);
    if (ok) {
      success(COMPANY_COPY.documents.toastUploaded);
    }
  }

  async function onTogglePartnerPep(partnerId: string) {
    // Do NOT emit any "Informação enviada à Avenia" toast while PEP submit is a local stub.
    await togglePartnerPep(partnerId);
  }

  if (loading) {
    return (
      <div
        className="mx-auto max-w-5xl space-y-6"
        aria-busy="true"
        aria-label={COMPANY_COPY.page.loadingLabel}
      >
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-11 w-full" />
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-14 w-64" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="font-serif text-[30px] font-bold text-foreground">
            {COMPANY_COPY.page.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {COMPANY_COPY.page.subtitle}
          </p>
        </div>
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {error ?? COMPANY_COPY.page.loadError}
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={reload}>
              {COMPANY_COPY.page.retryAction}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <CompanyHeader
        aveniaStatusKind={data.aveniaStatusKind}
        aveniaStatusLabel={data.aveniaStatusLabel}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={pendingDocuments.length}
      />

      {activeTab === "perfil" && (
        <CompanyProfileTab
          profile={data.profile}
          error={data.profileError}
          onRetry={reload}
          showPepSection={showPepSection}
          pepPartners={data.pepPartners}
          pepDeclarationAccepted={pepDeclarationAccepted}
          onTogglePartnerPep={onTogglePartnerPep}
          onChangePepDeclarationAccepted={setPepDeclarationAccepted}
        />
      )}

      {activeTab === "documentos" && (
        <CompanyDocumentsTab
          documents={data.documents}
          error={data.onboardingError}
          onRetry={reload}
          uploadingDocId={uploadingDocId}
          uploadError={uploadError}
          onUploadFile={onUploadFile}
        />
      )}

      {activeTab === "pendencias" && (
        <CompanyPendingTab
          pendingDocuments={pendingDocuments}
          error={data.onboardingError}
          onRetry={reload}
          uploadingDocId={uploadingDocId}
          uploadError={uploadError}
          onUploadFile={onUploadFile}
        />
      )}

      {activeTab === "limites" && (
        <CompanyLimitsTab
          limits={data.limits}
          error={data.limitsError}
          unavailableReason={data.limitsUnavailableReason}
          onRetry={reload}
          onOpenReviewModal={() => setLimitsModalOpen(true)}
        />
      )}

      <CompanyLimitsModal
        open={limitsModalOpen}
        onOpenChange={setLimitsModalOpen}
        onGoToDocuments={() => setActiveTab("documentos")}
      />
    </div>
  );
}
