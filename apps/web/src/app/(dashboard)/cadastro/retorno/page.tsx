"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, Banknote } from "lucide-react";
import { isKycResolved } from "@bravachain/shared";
import { useKycState } from "@/lib/hooks";
import { kycStatusMeta } from "@/components/kyc/status-meta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/state";

export default function KycRetornoPage() {
  const { data, loading, error, reload } = useKycState();
  const status = data?.status;

  // While verification is still processing, poll for a resolution.
  useEffect(() => {
    if (!status) return;
    if (status === "under_review" || status === "pending") {
      const id = setTimeout(reload, 5000);
      return () => clearTimeout(id);
    }
  }, [status, reload]);

  if (loading && !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Verificando o status…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const meta = kycStatusMeta[status ?? "not_started"];
  const resolved = status ? isKycResolved(status) : false;
  const processing = status === "under_review" || status === "pending";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div
            className={
              status === "approved"
                ? "rounded-full bg-success/10 p-4"
                : status === "rejected"
                  ? "rounded-full bg-destructive/10 p-4"
                  : "rounded-full bg-muted p-4"
            }
          >
            <meta.Icon
              className={
                status === "approved"
                  ? "h-9 w-9 text-success"
                  : status === "rejected"
                    ? "h-9 w-9 text-destructive"
                    : "h-9 w-9 text-muted-foreground"
              }
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{meta.title}</h1>
              <Badge variant={meta.badge}>{meta.label}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
            {status === "rejected" && data?.rejectionReason && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {data.rejectionReason}
              </p>
            )}
          </div>

          {/* Actions per outcome */}
          <div className="mt-2 flex w-full flex-col gap-2">
            {status === "approved" && (
              <>
                <Button asChild size="lg" className="w-full gap-2">
                  <Link href="/saque">
                    <Banknote className="h-4 w-4" />
                    Fazer um saque
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="w-full">
                  <Link href="/">Ir para o início</Link>
                </Button>
              </>
            )}

            {status === "rejected" && (
              <Button asChild size="lg" className="w-full gap-2">
                <Link href="/cadastro">
                  <RefreshCw className="h-4 w-4" />
                  Refazer verificação
                </Link>
              </Button>
            )}

            {status === "pending" && (
              <Button asChild size="lg" className="w-full gap-2">
                <Link href="/cadastro">
                  Voltar à verificação
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}

            {processing && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2"
                onClick={reload}
                disabled={loading}
              >
                <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                Atualizar status
              </Button>
            )}

            {!resolved && status !== "pending" && (
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/">Voltar ao início</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {processing && (
        <p className="text-center text-xs text-muted-foreground">
          Esta página atualiza automaticamente enquanto a análise estiver em andamento.
        </p>
      )}
    </div>
  );
}
