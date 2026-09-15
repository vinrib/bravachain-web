"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Users, RefreshCw } from "lucide-react";
import { endpoints } from "@bravachain/api-client";
import type { KycState } from "@/lib/models";
import { normalizeKycState } from "@/lib/models";
import { apiFetch, ApiError } from "@/lib/client-api";
import { consumeKybLinksHandoff } from "@/lib/kyb-handoff";
import { useKycState } from "@/lib/hooks";
import { kycStatusMeta } from "@/components/kyc/status-meta";
import { VerificationLinkCard } from "@/components/kyc/link-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/state";

export default function CadastroPage() {
  const kyc = useKycState();
  // After starting onboarding we get fresh links back; show them immediately.
  const [override, setOverride] = useState<KycState | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Approved status from the backend always wins over a stale local override.
  const state = kyc.data?.status === "approved" ? kyc.data : (override ?? kyc.data);

  // Show the links handed off from signup immediately (one-shot).
  useEffect(() => {
    const links = consumeKybLinksHandoff();
    if (links?.basicCompanyDataUrl || links?.authorizedRepresentativeUrl || links?.kycUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOverride(normalizeKycState(links));
    }
  }, []);

  async function handleStart() {
    setStarting(true);
    setStartError(null);
    try {
      // /kyc/submit requires `name`; the sub-account was already provisioned at
      // signup, so name is enough to (re)generate the Avenia links.
      const me = await apiFetch<{ name?: string; email?: string }>(endpoints.auth.me);
      const res = await apiFetch(endpoints.kyc.submit, {
        method: "POST",
        body: JSON.stringify({
          name: me?.name ?? me?.email ?? "Cooperativa",
          accountType: "COMPANY",
        }),
      });
      setOverride(normalizeKycState(res));
    } catch (err) {
      setStartError(
        err instanceof ApiError ? err.message : "Não foi possível iniciar a verificação.",
      );
    } finally {
      setStarting(false);
    }
  }

  if (kyc.loading && !override) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (kyc.error && !override) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState message={kyc.error} onRetry={kyc.reload} />
      </div>
    );
  }

  const status = state?.status ?? "not_started";
  const meta = kycStatusMeta[status];
  const hasPjLinks = Boolean(state?.basicCompanyDataUrl || state?.authorizedRepresentativeUrl);
  const hasPfLink = Boolean(state?.kycUrl);
  // Show the onboarding links whenever they exist and the KYB isn't resolved yet.
  const showLinks = (hasPjLinks || hasPfLink) && status !== "approved" && status !== "rejected";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verificação da cooperativa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Concluir o KYB libera saques e o uso completo da plataforma
        </p>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="flex items-start gap-4 py-6">
          <meta.Icon className="h-8 w-8 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{meta.title}</h2>
              <Badge variant={meta.badge}>{meta.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
            {status === "rejected" && state?.rejectionReason && (
              <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.rejectionReason}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approved → go to dashboard */}
      {status === "approved" && (
        <Button asChild size="lg" className="w-full gap-2">
          <Link href="/">
            Ir para o início
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}

      {/* Not started / rejected → start (or retry) onboarding */}
      {(status === "not_started" || status === "rejected") && (
        <div className="space-y-3">
          {startError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{startError}</p>
            </div>
          )}
          <Button size="lg" className="w-full gap-2" onClick={handleStart} disabled={starting}>
            {starting ? (
              <Spinner size="sm" />
            ) : (
              <>
                {status === "rejected" ? (
                  <RefreshCw className="h-4 w-4" />
                ) : null}
                {status === "rejected" ? "Tentar novamente" : "Iniciar verificação"}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Pending → show onboarding links */}
      {showLinks && (
        <div className="space-y-4">
          {hasPjLinks ? (
            <>
              <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <Users className="h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  A verificação da empresa tem <strong className="text-foreground">duas etapas</strong> e
                  cada link pode ser enviado a uma pessoa diferente: uma preenche os
                  <strong className="text-foreground"> dados da empresa</strong>, e o
                  <strong className="text-foreground"> representante legal</strong> faz a verificação
                  de identidade. As duas precisam ser concluídas.
                </p>
              </div>

              {state?.basicCompanyDataUrl && (
                <VerificationLinkCard
                  step={1}
                  title="Dados da empresa"
                  audience="Administrador da cooperativa"
                  description="Preenchimento das informações cadastrais da cooperativa (razão social, endereço, documentos)."
                  url={state.basicCompanyDataUrl}
                />
              )}
              {state?.authorizedRepresentativeUrl && (
                <VerificationLinkCard
                  step={2}
                  title="Representante legal"
                  audience="Representante legal"
                  description="Verificação de identidade da pessoa autorizada a representar a cooperativa."
                  url={state.authorizedRepresentativeUrl}
                />
              )}
            </>
          ) : (
            state?.kycUrl && (
              <VerificationLinkCard
                title="Verificação de identidade"
                description="Conclua a verificação de identidade para liberar a conta."
                url={state.kycUrl}
              />
            )
          )}

          <div className="flex flex-col items-center gap-2 pt-2">
            <Button asChild variant="secondary" className="gap-2">
              <Link href="/cadastro/retorno">
                Já concluí a verificação
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Após concluir nos links acima, verifique o status por aqui.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
