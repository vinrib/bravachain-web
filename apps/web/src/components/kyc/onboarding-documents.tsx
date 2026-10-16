"use client";

import { useEffect, useState } from "react";
import { Check, Clock, FileText, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/client-api";
import { getOnboardingStatus, type OnboardingStatus, type DocState } from "@/lib/onboarding/status";

const STATUS_VIEW: Record<OnboardingStatus["status"], { label: string; tone: "success" | "processing" | "review" | "error" | "neutral" }> = {
  approved: { label: "Aprovado", tone: "success" },
  pending: { label: "Pendente", tone: "processing" },
  in_review: { label: "Em análise", tone: "review" },
  rejected: { label: "Rejeitado", tone: "error" },
  unknown: { label: "—", tone: "neutral" },
};

function DocIcon({ state }: { state: DocState }) {
  if (state === "approved" || state === "sent")
    return <Check className="h-4 w-4 text-[#0b6b4f] dark:text-[#7be0b0]" />;
  if (state === "rejected") return <X className="h-4 w-4 text-destructive" />;
  return <Clock className="h-4 w-4 text-[#c77a18]" />;
}

const DOC_STATE_LABEL: Record<DocState, string> = {
  approved: "Aprovado",
  sent: "Enviado",
  rejected: "Rejeitado",
  pending: "Pendente",
};

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

  const view = STATUS_VIEW[data.status];
  const pending = data.documents.filter((d) => d.state === "pending" || d.state === "rejected");

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

        {data.status === "rejected" && data.rejectionReason && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {data.rejectionReason}
          </p>
        )}

        {data.status === "pending" && pending.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Faltam {pending.length} {pending.length === 1 ? "documento" : "documentos"} para concluir.
          </p>
        )}

        {data.documents.length > 0 && (
          <ul className="divide-y divide-border">
            {data.documents.map((d) => (
              <li key={d.type || d.label} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <DocIcon state={d.state} />
                  {d.label}
                </span>
                <span className="text-xs text-muted-foreground">{DOC_STATE_LABEL[d.state]}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
