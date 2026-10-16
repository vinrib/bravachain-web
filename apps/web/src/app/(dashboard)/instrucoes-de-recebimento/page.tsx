"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AccountCard } from "@/components/receive/account-card";
import { PendingAccountCard } from "@/components/receive/pending-account-card";
import { getAccounts } from "@/lib/receive/api";
import type { AccountsResponse } from "@/lib/receive/types";

export default function InstrucoesPage() {
  const [data, setData] = useState<AccountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    getAccounts()
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [nonce]);

  const accounts = data?.accounts ?? [];
  const pending = data?.pendingCurrencies ?? [];
  const isEmpty = accounts.length === 0 && pending.length === 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">
          Instruções de recebimento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dados da sua conta dedicada para receber do exterior.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          O importador deve usar exatamente estes dados no pagamento. Confira o nome
          do beneficiário e inclua a referência quando houver.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar as instruções.
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
      ) : isEmpty ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Sua conta dedicada ainda está sendo configurada. Avisaremos quando
            estiver pronta para receber.
          </CardContent>
        </Card>
      ) : (
        <>
          {accounts.map((a) => (
            <AccountCard key={a.currency} account={a} />
          ))}
          {pending.map((c) => (
            <PendingAccountCard key={c} currency={c} />
          ))}
        </>
      )}
    </div>
  );
}
