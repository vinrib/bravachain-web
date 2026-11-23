"use client";

import { useRef } from "react";
import { CheckCircle2, Clock, FileText, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { COMPANY_DOC_ACCEPT } from "@/lib/company/constants";
import { COMPANY_COPY } from "@/lib/company/copy";
import type { CompanyDocument } from "@/lib/company/types";

interface CompanyDocumentsTabProps {
  documents: CompanyDocument[];
  uploadingDocId: string | null;
  uploadError: string | null;
  onUploadFile: (doc: CompanyDocument, file: File) => void;
}

export function CompanyDocumentsTab({
  documents,
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

        {uploadError && (
          <div
            role="alert"
            className="border-b border-destructive/20 bg-destructive/10 px-6 py-3 text-xs text-destructive"
          >
            {uploadError}
          </div>
        )}

        <CardContent className="divide-y divide-border p-0">
          {documents.map((doc) => {
            const isUploading = uploadingDocId === doc.id;
            const isPending = doc.status === COMPANY_COPY.documents.status.pending;
            const isApproved = doc.status === COMPANY_COPY.documents.status.approved;
            const isInAnalysis =
              doc.status === COMPANY_COPY.documents.status.inAnalysis;

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
                  {isApproved && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1 font-mono text-[11px] font-medium text-success ring-1 ring-inset ring-success/25">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {COMPANY_COPY.documents.status.approved}
                    </span>
                  )}

                  {isInAnalysis && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-warning/10 px-2.5 py-1 font-mono text-[11px] font-medium text-warning ring-1 ring-inset ring-warning/25">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {COMPANY_COPY.documents.status.inAnalysis}
                    </span>
                  )}

                  {isPending && (
                    <>
                      <span className="inline-flex items-center rounded-lg border border-border bg-muted px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground">
                        {COMPANY_COPY.documents.status.pending}
                      </span>

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
                          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {isUploading
                          ? COMPANY_COPY.documents.uploadingAction
                          : COMPANY_COPY.documents.uploadAction}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
