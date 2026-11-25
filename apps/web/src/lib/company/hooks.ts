"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchCompanyLimitsSection,
  fetchCompanyOnboardingSection,
  fetchCompanyProfileSection,
  submitPartnerPepDeclaration,
  uploadCompanyDocument,
} from "./api";
import { COMPANY_COPY } from "./copy";
import type {
  AveniaStatusKind,
  CompanyDocument,
  CompanyLimitRow,
  CompanyProfile,
  PepPartner,
  RawMeResponse,
  RawOnboardingCompany,
  RawOnboardingStatus,
} from "./types";
import {
  mapCompanyDocuments,
  mapCompanyProfile,
  resolveAveniaStatus,
  validateCompanyDocumentFile,
} from "./validate";

export interface UseCompanyDataResult {
  profile: CompanyProfile | null;
  profileLoading: boolean;
  profileError: boolean;
  reloadProfile: () => void;

  aveniaStatusKind: AveniaStatusKind;
  aveniaStatusLabel: string;
  onboardingLoading: boolean;
  onboardingError: boolean;
  documents: CompanyDocument[];
  pendingDocuments: CompanyDocument[];
  reloadOnboarding: () => void;

  limits: CompanyLimitRow[];
  limitsLoading: boolean;
  limitsError: boolean;
  limitsForbidden: boolean;
  limitsUnavailableReason: string | null;
  reloadLimits: () => void;

  pepPartners: PepPartner[];
  uploadingDocId: string | null;
  uploadError: string | null;
  pepDeclarationAccepted: boolean;
  setPepDeclarationAccepted: (accepted: boolean) => void;
  togglePartnerPep: (partnerId: string) => Promise<boolean | null>;
  handleUploadDocument: (
    doc: CompanyDocument,
    file: File,
  ) => Promise<boolean>;
}

export function useCompanyData(): UseCompanyDataResult {
  // Independent section state so skeleton, error, and retry on one card
  // NEVER affect other cards or tabs.
  const [rawCompany, setRawCompany] = useState<RawOnboardingCompany | null>(
    null,
  );
  const [rawMe, setRawMe] = useState<RawMeResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [profileNonce, setProfileNonce] = useState(0);

  const [rawOnboarding, setRawOnboarding] =
    useState<RawOnboardingStatus | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [onboardingError, setOnboardingError] = useState(false);
  const [onboardingNonce, setOnboardingNonce] = useState(0);

  const [limits, setLimits] = useState<CompanyLimitRow[]>([]);
  const [limitsLoading, setLimitsLoading] = useState(true);
  const [limitsError, setLimitsError] = useState(false);
  const [limitsForbidden, setLimitsForbidden] = useState(false);
  const [limitsUnavailableReason, setLimitsUnavailableReason] = useState<
    string | null
  >(null);
  const [limitsNonce, setLimitsNonce] = useState(0);

  // No client-facing UBO/PEP endpoint exists yet; never fabricate partners.
  const [pepPartners, setPepPartners] = useState<PepPartner[]>([]);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // PEP declaration checkbox MUST NEVER start pre-checked.
  const [pepDeclarationAccepted, setPepDeclarationAccepted] = useState(false);

  const profileSeqRef = useRef(0);
  const onboardingSeqRef = useRef(0);
  const limitsSeqRef = useRef(0);

  useEffect(() => {
    const seq = ++profileSeqRef.current;
    const controller = new AbortController();

    fetchCompanyProfileSection(controller.signal)
      .then((res) => {
        if (controller.signal.aborted || profileSeqRef.current !== seq) return;
        setRawCompany(res.company);
        setRawMe(res.me);
        setProfileError(res.error);
      })
      .catch((err) => {
        if (controller.signal.aborted || profileSeqRef.current !== seq) return;
        if (err instanceof Error && err.name === "AbortError") return;
        setRawCompany(null);
        setProfileError(true);
      })
      .finally(() => {
        if (controller.signal.aborted || profileSeqRef.current !== seq) return;
        setProfileLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [profileNonce]);

  useEffect(() => {
    const seq = ++onboardingSeqRef.current;
    const controller = new AbortController();

    fetchCompanyOnboardingSection(controller.signal)
      .then((res) => {
        if (controller.signal.aborted || onboardingSeqRef.current !== seq) {
          return;
        }
        setRawOnboarding(res.onboarding);
        setDocuments(mapCompanyDocuments(res.onboarding));
        setOnboardingError(res.error);
      })
      .catch((err) => {
        if (controller.signal.aborted || onboardingSeqRef.current !== seq) {
          return;
        }
        if (err instanceof Error && err.name === "AbortError") return;
        setRawOnboarding(null);
        setDocuments([]);
        setOnboardingError(true);
      })
      .finally(() => {
        if (controller.signal.aborted || onboardingSeqRef.current !== seq) {
          return;
        }
        setOnboardingLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [onboardingNonce]);

  useEffect(() => {
    const seq = ++limitsSeqRef.current;
    const controller = new AbortController();

    fetchCompanyLimitsSection(controller.signal)
      .then((res) => {
        if (controller.signal.aborted || limitsSeqRef.current !== seq) return;
        setLimits(res.limits);
        setLimitsError(res.error);
        setLimitsForbidden(res.forbidden);
        setLimitsUnavailableReason(res.unavailableReason);
      })
      .catch((err) => {
        if (controller.signal.aborted || limitsSeqRef.current !== seq) return;
        if (err instanceof Error && err.name === "AbortError") return;
        setLimits([]);
        setLimitsError(true);
        setLimitsForbidden(false);
        setLimitsUnavailableReason(null);
      })
      .finally(() => {
        if (controller.signal.aborted || limitsSeqRef.current !== seq) return;
        setLimitsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [limitsNonce]);

  const reloadProfile = useCallback(() => {
    setProfileLoading(true);
    setProfileError(false);
    setProfileNonce((n) => n + 1);
  }, []);

  const reloadOnboarding = useCallback(() => {
    setOnboardingLoading(true);
    setOnboardingError(false);
    setOnboardingNonce((n) => n + 1);
  }, []);

  const reloadLimits = useCallback(() => {
    setLimitsLoading(true);
    setLimitsError(false);
    setLimitsForbidden(false);
    setLimitsNonce((n) => n + 1);
  }, []);

  const aveniaStatus = useMemo(
    () => resolveAveniaStatus(rawOnboarding),
    [rawOnboarding],
  );

  const profile = useMemo(
    () =>
      mapCompanyProfile({
        company: rawCompany,
        me: rawMe,
        onboarding: rawOnboarding,
      }),
    [rawCompany, rawMe, rawOnboarding],
  );

  const pendingDocuments = useMemo(() => {
    if (onboardingError) return [];
    return documents.filter((doc) => doc.kind === "pending");
  }, [documents, onboardingError]);

  const togglePartnerPep = useCallback(
    async (partnerId: string): Promise<boolean | null> => {
      let nextValue: boolean | null = null;

      setPepPartners((prev) => {
        const target = prev.find((p) => p.id === partnerId);
        if (!target) return prev;
        nextValue = !target.isPep;
        return prev.map((p) =>
          p.id === partnerId ? { ...p, isPep: !p.isPep } : p,
        );
      });

      if (nextValue !== null) {
        await submitPartnerPepDeclaration(partnerId, nextValue);
      }

      return nextValue;
    },
    [],
  );

  const handleUploadDocument = useCallback(
    async (doc: CompanyDocument, file: File): Promise<boolean> => {
      if (!doc.apiType) {
        setUploadError(COMPANY_COPY.documents.errors.uploadFailed);
        return false;
      }

      const validationError = validateCompanyDocumentFile(file);
      if (validationError) {
        setUploadError(validationError);
        return false;
      }

      setUploadError(null);
      setUploadingDocId(doc.id);

      try {
        const updated = await uploadCompanyDocument(doc, file);
        setDocuments((prev) =>
          prev.map((item) => (item.id === doc.id ? updated : item)),
        );
        return true;
      } catch {
        setUploadError(COMPANY_COPY.documents.errors.uploadFailed);
        return false;
      } finally {
        setUploadingDocId(null);
      }
    },
    [],
  );

  return {
    profile,
    profileLoading,
    profileError: profileError || (!profileLoading && profile === null),
    reloadProfile,

    aveniaStatusKind: aveniaStatus.kind,
    aveniaStatusLabel: aveniaStatus.label,
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
  };
}
