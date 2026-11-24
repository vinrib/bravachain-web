"use client";

import { useRef } from "react";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { COMPANY_DOC_ACCEPT } from "@/lib/company/constants";
import { COMPANY_COPY } from "@/lib/company/copy";
import type { CompanyDocument } from "@/lib/company/types";

interface CompanyDocumentsTabProps {
  documents: CompanyDocument[];
  error: boolean;
  onRetry: () => void;
  uploadingDocId: string | null;
  uploadError: string | null;
  onUploadFile: (doc: CompanyDocument, file: File) => void;
}

export function CompanyDocumentsTab({
  documents,
  error,
  onRetry,
  uploadingDocId,
  uploadError,
  onUploadFile,
}: CompanyDocumentsTabProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div
      id="company-panel-documentos"
      role="tabpanel"
      aria-labelledby="company-tab-documentos"
    >
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-sans text-base font-semibold text-foreground">
              {COMPANY_COPY.documents.title}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {COMPANY_COPY.documents.subtitle}
            </p>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {COMPANY_COPY.documents.acceptedHint}
          </span>
        </div>

        {error ? (
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {COMPANY_COPY.documents.loadError}
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
              {COMPANY_COPY.page.retryAction}
            </Button>
          </CardContent>
        ) : (
          <>
            {uploadError && (
              <div
                role="alert"
                className="border-b border-destructive/20 bg-destructive/10 px-6 py-3 text-xs text-destructive"
              >
                {uploadError}
              </div>
            )}

            {documents.length === 0 ? (
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {COMPANY_COPY.documents.empty}
                </p>
              </CardContent>
            ) : (
              <CardContent className="divide-y divide-border p-0">
                {documents.map((doc) => {
                  const isUploading = uploadingDocId === doc.id;
                  const isPending = doc.kind === "pending";
                  const canUpload = isPending && doc.apiType !== null;

                  return (
                    <div
                      key={doc.id}
                      className="flex flex-col justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground">
                          <FileText className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">
                            {doc.name}
                          </div>
                          <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                            {doc.category}
                            {doc.fileName
                              ? ` • ${doc.fileName}${doc.uploadedAtLabel ? ` (${doc.uploadedAtLabel})` : ""}`
                              : ` • ${COMPANY_COPY.documents.awaitingUpload}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {doc.kind === "uploaded" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 font-mono text-[11px] font-medium text-foreground ring-1 ring-inset ring-border">
                            <CheckCircle2
                              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            />
                            {doc.statusLabel}
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center rounded-lg border border-border bg-muted px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground">
                              {doc.statusLabel}
                            </span>

                            {canUpload && (
                              <>
                                <input
                                  ref={(el) => {
                                    inputRefs.current[doc.id] = el;
                                  }}
                                  type="file"
                                  accept={COMPANY_DOC_ACCEPT}
                                  aria-label={`${COMPANY_COPY.documents.uploadAction} — ${doc.name}`}
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
                                    : COMPANY_COPY.documents.uploadAction}
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
