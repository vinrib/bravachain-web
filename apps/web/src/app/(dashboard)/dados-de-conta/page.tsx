"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useKycState } from "@/lib/hooks";
import { ApiError } from "@/lib/client-api";
import { getAccounts } from "@/lib/receive/api";
import { AccountCard } from "@/components/receive/account-card";
import { PendingAccountCard } from "@/components/receive/pending-account-card";
import { PixKeyCard } from "@/components/receive/pix-key-card";
import { CompanyIdentityCard } from "@/components/dados-conta/company-identity-card";
import { ACCOUNT_SECURITY_NOTICE } from "@/lib/receive/account-content";
import type { AccountsResponse } from "@/lib/receive/types";

function KybGate() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <ShieldAlert className="h-10 w-10 text-[#c77a18]" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Verificação necessária</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Conclua a verificação (KYB) da empresa para ver as contas de recebimento.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/cadastro">
              Concluir verificação
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DadosContaPage() {
  const kyc = useKycState();
  const kybApproved = kyc.data?.status === "approved";
  const kybResolved = Boolean(kyc.data);

  const [data, setData] = useState<AccountsResponse | null>(null);
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
    getAccounts()
      .then((r) => {
        if (active) setData(r);
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

  // KYB not approved (from status or a 403 on the accounts endpoint).
  if ((kybResolved && !kybApproved) || forbidden) return <KybGate />;

  const accounts = data?.accounts ?? [];
  const pending = data?.pendingCurrencies ?? [];
  const noAccounts = !loading && !error && accounts.length === 0 && pending.length === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Dados de conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identidade da empresa e contas para receber do exterior.
        </p>
      </div>

      {/* Identidade da empresa */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-semibold text-foreground">Identidade da empresa</h2>
        <CompanyIdentityCard />
      </section>

      {/* Contas para recebimento */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-semibold text-foreground">Contas para recebimento</h2>

        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{ACCOUNT_SECURITY_NOTICE}</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar as contas.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-4"
                onClick={() => setNonce((n) => n + 1)}
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : noAccounts ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma conta de recebimento disponível ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {accounts.map((a) => (
              <AccountCard key={a.currency} account={a} />
            ))}
            {pending.map((c) => (
              <PendingAccountCard key={c} currency={c} />
            ))}
          </div>
        )}
      </section>

      {/* Chave PIX padrão */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-semibold text-foreground">Chave PIX padrão</h2>
        <PixKeyCard />
      </section>
    </div>
  );
}
