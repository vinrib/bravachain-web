"use client";

import { useRef } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { COMPANY_DOC_ACCEPT } from "@/lib/company/constants";
import { COMPANY_COPY } from "@/lib/company/copy";
import type { CompanyDocument } from "@/lib/company/types";

interface CompanyPendingTabProps {
  pendingDocuments: CompanyDocument[];
  error: boolean;
  onRetry: () => void;
  uploadingDocId: string | null;
  uploadError: string | null;
  onUploadFile: (doc: CompanyDocument, file: File) => void;
}

export function CompanyPendingTab({
  pendingDocuments,
  error,
  onRetry,
  uploadingDocId,
  uploadError,
  onUploadFile,
}: CompanyPendingTabProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div
      id="company-panel-pendencias"
      role="tabpanel"
      aria-labelledby="company-tab-pendencias"
    >
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-sans text-base font-semibold text-foreground">
                {COMPANY_COPY.pending.title}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {COMPANY_COPY.pending.subtitle}
              </p>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {COMPANY_COPY.documents.acceptedHint}
            </span>
          </div>

          {error ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                {COMPANY_COPY.pending.loadError}
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
                {COMPANY_COPY.page.retryAction}
              </Button>
            </div>
          ) : (
            <>
              {uploadError && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive"
                >
                  {uploadError}
                </div>
              )}

              {pendingDocuments.length === 0 ? (
                <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
                  <CheckCircle2
                    className="mx-auto h-8 w-8 text-success"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-foreground">
                    {COMPANY_COPY.pending.emptyTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {COMPANY_COPY.pending.emptyDescription}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingDocuments.map((doc) => {
                    const isUploading = uploadingDocId === doc.id;
                    const canUpload = doc.apiType !== null;
                    return (
                      <div
                        key={doc.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">
                            {doc.name}
                          </div>
                          <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {doc.category} • {doc.statusLabel}
                          </div>
                        </div>

                        {canUpload && (
                          <div className="shrink-0">
                            <input
                              ref={(el) => {
                                inputRefs.current[doc.id] = el;
                              }}
                              type="file"
                              accept={COMPANY_DOC_ACCEPT}
                              aria-label={`${COMPANY_COPY.pending.uploadAction} — ${doc.name}`}
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (file) onUploadFile(doc, file);
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={uploadingDocId !== null}
                              onClick={() => inputRefs.current[doc.id]?.click()}
                            >
                              {isUploading ? (
                                <Spinner size="sm" />
                              ) : (
                                <Upload
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )}
                              {isUploading
                                ? COMPANY_COPY.documents.uploadingAction
                                : COMPANY_COPY.pending.uploadAction}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
