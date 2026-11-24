"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchCompanyBundle,
  submitPartnerPepDeclaration,
  uploadCompanyDocument,
} from "./api";
import { COMPANY_COPY } from "./copy";
import type { CompanyBundle, CompanyDocument } from "./types";
import { validateCompanyDocumentFile } from "./validate";

export interface UseCompanyDataResult {
  data: CompanyBundle | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  pendingDocuments: CompanyDocument[];
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
  const [data, setData] = useState<CompanyBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // PEP declaration checkbox MUST NEVER start pre-checked.
  const [pepDeclarationAccepted, setPepDeclarationAccepted] = useState(false);

  const reqSeqRef = useRef(0);

  useEffect(() => {
    const seq = ++reqSeqRef.current;
    const controller = new AbortController();

    fetchCompanyBundle(controller.signal)
      .then((bundle) => {
        if (controller.signal.aborted || reqSeqRef.current !== seq) return;
        setData(bundle);
      })
      .catch((err) => {
        if (controller.signal.aborted || reqSeqRef.current !== seq) return;
        if (err instanceof Error && err.name === "AbortError") return;
        setError(COMPANY_COPY.page.loadError);
      })
      .finally(() => {
        if (controller.signal.aborted || reqSeqRef.current !== seq) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [reloadNonce]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadNonce((n) => n + 1);
  }, []);

  const pendingDocuments = useMemo(() => {
    if (!data || data.onboardingError) return [];
    return data.documents.filter((doc) => doc.kind === "pending");
  }, [data]);

  const togglePartnerPep = useCallback(
    async (partnerId: string): Promise<boolean | null> => {
      let nextValue: boolean | null = null;

      setData((prev) => {
        if (!prev) return prev;
        const target = prev.pepPartners.find((p) => p.id === partnerId);
        if (!target) return prev;
        nextValue = !target.isPep;
        return {
          ...prev,
          pepPartners: prev.pepPartners.map((p) =>
            p.id === partnerId ? { ...p, isPep: !p.isPep } : p,
          ),
        };
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
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            documents: prev.documents.map((item) =>
              item.id === doc.id ? updated : item,
            ),
          };
        });
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
  };
}
