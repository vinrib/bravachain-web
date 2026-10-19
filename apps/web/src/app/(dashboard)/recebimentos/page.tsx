"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AccountCard } from "@/components/receive/account-card";
import { PendingAccountCard } from "@/components/receive/pending-account-card";
import { PixKeyCard } from "@/components/receive/pix-key-card";
import { getAccounts } from "@/lib/receive/api";
import type { AccountsResponse } from "@/lib/receive/types";

/**
 * Tela única de Recebimentos: reúne o que antes se repetia em "Instruções de
 * recebimento" e "Dados de conta". Seção 1 (Receber do exterior) reaproveita os
 * cards de conta dedicada (USD/EUR); seção 2 (Receber em reais) a chave PIX. A
 * identidade da empresa foi movida para Configurações › Perfil.
 */
export default function RecebimentosPage() {
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
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Recebimentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dados para receber do exterior e em reais, num só lugar.
        </p>
      </div>

      {/* 1. Receber do exterior — contas dedicadas USD/EUR */}
      <section className="space-y-4">
        <h2 className="px-1 text-base font-semibold text-foreground">Receber do exterior</h2>

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
                Não foi possível carregar as contas de recebimento.
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
      </section>

      {/* 2. Receber em reais — chave PIX usada nos saques */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-semibold text-foreground">Receber em reais</h2>
        <PixKeyCard label="Chave PIX para saques" />
      </section>
    </div>
  );
}
