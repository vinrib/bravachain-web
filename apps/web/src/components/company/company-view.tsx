"use client";

import { useState } from "react";
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
    profile,
    profileLoading,
    profileError,
    reloadProfile,
    aveniaStatusKind,
    aveniaStatusLabel,
    onboardingLoading,
    onboardingError,
    documents,
    pendingDocuments,
    reloadOnboarding,
    limits,
    limitsLoading,
    limitsError,
    limitsForbidden,
    limitsUnavailableReason,
    reloadLimits,
    pepPartners,
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <CompanyHeader
        aveniaStatusKind={aveniaStatusKind}
        aveniaStatusLabel={aveniaStatusLabel}
        statusLoading={onboardingLoading}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={pendingDocuments.length}
      />

      {activeTab === "perfil" && (
        <CompanyProfileTab
          profile={profile}
          loading={profileLoading}
          error={profileError}
          onRetry={reloadProfile}
          showPepSection={showPepSection}
          pepPartners={pepPartners}
          pepDeclarationAccepted={pepDeclarationAccepted}
          onTogglePartnerPep={onTogglePartnerPep}
          onChangePepDeclarationAccepted={setPepDeclarationAccepted}
        />
      )}

      {activeTab === "documentos" && (
        <CompanyDocumentsTab
          documents={documents}
          error={onboardingError}
          onRetry={reloadOnboarding}
          uploadingDocId={uploadingDocId}
          uploadError={uploadError}
          onUploadFile={onUploadFile}
        />
      )}

      {activeTab === "pendencias" && (
        <CompanyPendingTab
          pendingDocuments={pendingDocuments}
          error={onboardingError}
          onRetry={reloadOnboarding}
          uploadingDocId={uploadingDocId}
          uploadError={uploadError}
          onUploadFile={onUploadFile}
        />
      )}

      {activeTab === "limites" && (
        <CompanyLimitsTab
          limits={limits}
          loading={limitsLoading}
          error={limitsError}
          forbidden={limitsForbidden}
          unavailableReason={limitsUnavailableReason}
          onRetry={reloadLimits}
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
