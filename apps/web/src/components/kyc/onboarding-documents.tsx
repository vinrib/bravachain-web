"use client";

import { useEffect, useState } from "react";
import { Check, Clock, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/client-api";
import {
  getOnboardingStatus,
  documentTypeLabel,
  type KybStatus,
  type OnboardingStatus,
} from "@/lib/onboarding/status";

type Tone = "success" | "processing" | "review" | "error" | "neutral";

const STATUS_VIEW: Record<KybStatus, { label: string; tone: Tone; message: string | null }> = {
  PENDING: {
    label: "Pendente",
    tone: "processing",
    message: "Envie os documentos abaixo para concluir a verificação.",
  },
  SUBMITTED: {
    label: "Em análise",
    tone: "review",
    message: "Seus documentos foram enviados e estão em análise.",
  },
  APPROVED: { label: "Aprovado", tone: "success", message: null },
  REJECTED: { label: "Rejeitado", tone: "error", message: null },
  RESUBMIT: {
    label: "Reenvio necessário",
    tone: "review",
    message: "Precisamos de novos documentos.",
  },
};

const FALLBACK_VIEW = { label: "—", tone: "neutral" as Tone, message: null };

function formatSize(kb: number): string {
  if (!Number.isFinite(kb) || kb <= 0) return "";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.round(kb)} KB`;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

export function OnboardingDocuments() {
  const [data, setData] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    setForbidden(false);
    getOnboardingStatus()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 403) setForbidden(true);
        else setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [nonce]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  if (forbidden) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Conclua a verificação (KYB) para ver o status dos documentos.
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o status da verificação.
          </p>
          <Button type="button" variant="secondary" className="mt-3" onClick={() => setNonce((n) => n + 1)}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const view = STATUS_VIEW[data.kybStatus] ?? FALLBACK_VIEW;
  const missing = data.missingDocuments;

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Status da verificação
          </p>
          <StatusBadge label={view.label} tone={view.tone} />
        </div>

        {/* Motivo da rejeição (REJECTED). */}
        {data.kybStatus === "REJECTED" && data.kybRejectedReason && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {data.kybRejectedReason}
          </p>
        )}

        {/* Mensagem do estado (inclui "Precisamos de novos documentos" no RESUBMIT). */}
        {view.message && (
          <p className="text-sm text-muted-foreground">{view.message}</p>
        )}

        {/* Documentos enviados. */}
        {data.documents.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Enviados
            </p>
            <ul className="divide-y divide-border">
              {data.documents.map((doc) => {
                const size = formatSize(doc.fileSizeKb);
                const date = formatDate(doc.uploadedAt);
                const meta = [size, date].filter(Boolean).join(" · ");
                return (
                  <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 shrink-0 text-[#0b6b4f] dark:text-[#7be0b0]" />
                      <span className="min-w-0">
                        <span className="block truncate">{documentTypeLabel(doc.type)}</span>
                        {doc.fileName && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {doc.fileName}
                          </span>
                        )}
                      </span>
                    </span>
                    {meta && <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Documentos pendentes (missingDocuments) com nomes legíveis. */}
        {missing.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pendentes ({missing.length})
            </p>
            <ul className="divide-y divide-border">
              {missing.map((type) => (
                <li key={type} className="flex items-center gap-2 py-2.5 text-sm text-foreground">
                  <Clock className="h-4 w-4 shrink-0 text-[#c77a18]" />
                  {documentTypeLabel(type)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
