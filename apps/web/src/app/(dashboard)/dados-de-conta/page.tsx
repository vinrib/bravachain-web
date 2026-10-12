"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useKycState } from "@/lib/hooks";
import { getAccounts } from "@/lib/receive/api";
import { AccountCard } from "@/components/receive/account-card";
import { PendingAccountCard } from "@/components/receive/pending-account-card";
import {
  ACCOUNT_SECURITY_NOTICE,
  ACCOUNT_FEE_NOTE,
  ACCOUNT_MIN_RECOMMENDATION,
} from "@/lib/receive/account-content";
import type { AccountsResponse } from "@/lib/receive/types";

export default function DadosContaPage() {
  const kyc = useKycState();
  const kybApproved = kyc.data?.status === "approved";
  const kybResolved = Boolean(kyc.data);

  const [data, setData] = useState<AccountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = () => setNonce((n) => n + 1);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    getAccounts()
      .then((r) => {
        if (active) setData(r);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os dados de conta.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [nonce]);

  // KYB gate: dedicated accounts require approved verification.
  if (kybResolved && !kybApproved) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <ShieldAlert className="h-10 w-10 text-amber-500" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Verificação necessária
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Para receber do exterior, a empresa precisa concluir a verificação (KYB).
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

  const isEmpty =
    !data || (data.accounts.length === 0 && data.pendingCurrencies.length === 0);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dados de conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contas para receber do exterior em nome da sua empresa
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{ACCOUNT_SECURITY_NOTICE}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={reload}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {data?.accounts.map((a) => (
            <AccountCard key={a.currency} account={a} />
          ))}
          {data?.pendingCurrencies.map((c) => (
            <PendingAccountCard key={c} currency={c} />
          ))}

          {isEmpty && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma conta disponível ainda.
              </CardContent>
            </Card>
          )}

          {!isEmpty && (
            <div className="space-y-1.5 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              <p>{ACCOUNT_FEE_NOTE}</p>
              <p>{ACCOUNT_MIN_RECOMMENDATION}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
