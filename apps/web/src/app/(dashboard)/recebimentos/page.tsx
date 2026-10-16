"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useKycState } from "@/lib/hooks";
import { PixKeyCard } from "@/components/receive/pix-key-card";
import { CreateReceiveForm } from "@/components/receive/create-receive-form";
import { RecentReceives } from "@/components/receive/recent-receives";
import { PendingAccountCard } from "@/components/receive/pending-account-card";
import { CurrencyFlag } from "@/components/ui/flags";
import { getAccounts } from "@/lib/receive/api";
import type { AccountsResponse } from "@/lib/receive/types";

const CURRENCY_NAME: Record<string, string> = { USD: "dólar", EUR: "euro" };

function DedicatedAccountCard({ currency }: { currency: string }) {
  const name = CURRENCY_NAME[currency] ?? currency;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          <CurrencyFlag currency={currency} size={24} />
          <span className="text-sm font-semibold text-foreground">{currency}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Para receber em {name}, peça ao importador que envie o valor para a sua
          conta dedicada. Você não precisa gerar instruções.
        </p>
        <Button asChild className="mt-4 gap-2">
          <Link href="/instrucoes-de-recebimento">
            Ver instruções de recebimento
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function RecebimentosPage() {
  const kyc = useKycState();
  const kybApproved = kyc.data?.status === "approved";
  const kybResolved = Boolean(kyc.data);

  const [accounts, setAccounts] = useState<AccountsResponse | null>(null);

  useEffect(() => {
    let active = true;
    getAccounts()
      .then((d) => {
        if (active) setAccounts(d);
      })
      .catch(() => {
        /* no accounts info — fall back to the create form */
      });
    return () => {
      active = false;
    };
  }, []);

  // KYB gate: receivings require approved verification (same as withdrawals).
  if (kybResolved && !kybApproved) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <ShieldAlert className="h-10 w-10 text-[#c77a18]" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Verificação necessária
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Para receber do exterior, a empresa precisa concluir a verificação (KYB).
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/configuracoes/verificacao">
                Concluir verificação
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dedicated = (accounts?.accounts ?? []).filter(
    (a) => a.currency === "USD" || a.currency === "EUR",
  );
  const pending = (accounts?.pendingCurrencies ?? []).filter(
    (c) => c === "USD" || c === "EUR",
  );
  // Hide the share-link form once any dedicated/pending account exists.
  const hasDedicated = dedicated.length > 0 || pending.length > 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Recebimentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receba pagamentos do exterior na sua conta dedicada.
        </p>
      </div>

      <PixKeyCard />

      {hasDedicated ? (
        <>
          {dedicated.map((a) => (
            <DedicatedAccountCard key={a.currency} currency={a.currency} />
          ))}
          {pending.map((c) => (
            <PendingAccountCard key={c} currency={c} />
          ))}
        </>
      ) : (
        <CreateReceiveForm />
      )}

      <RecentReceives />
    </div>
  );
}
