"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getAccounts } from "@/lib/receive/api";
import { featureFlags } from "@/lib/feature-flags";
import type { AccountsResponse } from "@/lib/receive/types";

const LABEL: Record<string, { name: string; flag: string }> = {
  USD: { name: "Dólar (USD)", flag: "🇺🇸" },
  EUR: { name: "Euro (EUR)", flag: "🇪🇺" },
};

function CardShell({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  const meta = LABEL[currency] ?? { name: currency, flag: "" };
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{meta.name}</p>
          <span className="text-lg" aria-hidden="true">
            {meta.flag}
          </span>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Per-currency receiving cards for USD/EUR on Início — the instructions to pay
 * the exporter (GET /v1/receive/accounts). Never a USD/EUR balance (which
 * doesn't exist). Renders nothing if the endpoint isn't available (e.g. KYB not
 * approved) so the home page degrades gracefully.
 */
export function ReceiveCurrencyCards() {
  const [data, setData] = useState<AccountsResponse | null>(null);

  useEffect(() => {
    let active = true;
    getAccounts()
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        /* no dedicated account yet / not KYB — just don't show the cards */
      });
    return () => {
      active = false;
    };
  }, []);

  const confirmed = (data?.accounts ?? []).filter(
    (a) => a.currency === "USD" || a.currency === "EUR",
  );
  const pending = (data?.pendingCurrencies ?? []).filter(
    (c) => c === "USD" || c === "EUR",
  );

  if (confirmed.length === 0 && pending.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 px-1 text-base font-semibold text-foreground">
        Receber do exterior
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {confirmed.map((acc) => (
          <CardShell key={acc.currency} currency={acc.currency}>
            <p className="mt-1 text-xs text-muted-foreground">
              Instruções de pagamento para o importador
            </p>
            {acc.beneficiaryName && (
              <p className="mt-2 truncate text-sm text-foreground">
                {acc.beneficiaryName}
              </p>
            )}
            {(acc.iban || acc.accountNumber) && (
              <p className="truncate text-xs text-muted-foreground tabular-nums">
                {acc.iban ?? acc.accountNumber}
              </p>
            )}
            {featureFlags.dadosConta && (
              <Link
                href="/dados-de-conta"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Ver dados
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </CardShell>
        ))}
        {pending.map((cur) => (
          <CardShell key={cur} currency={cur}>
            <p className="mt-2 text-sm text-muted-foreground">
              Conta em configuração. Avisaremos quando estiver pronta para receber.
            </p>
          </CardShell>
        ))}
      </div>
    </div>
  );
}
