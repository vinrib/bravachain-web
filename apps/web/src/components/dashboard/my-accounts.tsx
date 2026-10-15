"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Landmark } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyFlag } from "@/components/ui/flags";
import { useBalance } from "@/lib/hooks";
import { getAccounts } from "@/lib/receive/api";
import { featureFlags } from "@/lib/feature-flags";
import type { AccountsResponse, DedicatedAccount } from "@/lib/receive/types";

function masked(account: DedicatedAccount): string | null {
  const raw = account.iban ?? account.accountNumber ?? null;
  if (!raw) return null;
  const tail = raw.replace(/\s+/g, "").slice(-4);
  return account.iban ? `IBAN •••• ${tail}` : `•••• ${tail}`;
}

function ForeignCard({ account }: { account: DedicatedAccount }) {
  return (
    <Card className="relative">
      {featureFlags.recebimentos && (
        <Link
          href="/instrucoes-de-recebimento"
          aria-label="Ver instruções de recebimento"
          className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
      <CardContent className="pt-5">
        <div className="flex items-center gap-2">
          <CurrencyFlag currency={account.currency} size={24} />
          <span className="text-sm font-semibold text-foreground">{account.currency}</span>
        </div>
        <p className="mt-2 font-serif text-base font-bold text-foreground">
          Instruções de recebimento
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Landmark className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-mono">
            {masked(account) ?? account.bankName ?? "—"}
          </span>
        </div>
        {account.bankName && masked(account) && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{account.bankName}</p>
        )}
      </CardContent>
    </Card>
  );
}

/** "Minhas contas" (artboard 3a/4a): BRL balance (highlight) + USD/EUR receiving
 *  instructions. Never a USD/EUR balance. EUR appears only when it's a ready
 *  dedicated account (present in /v1/receive/accounts). */
export function MyAccounts() {
  const balance = useBalance();
  const [accounts, setAccounts] = useState<AccountsResponse | null>(null);

  useEffect(() => {
    let active = true;
    getAccounts()
      .then((d) => {
        if (active) setAccounts(d);
      })
      .catch(() => {
        /* no dedicated account yet — just show the BRL card */
      });
    return () => {
      active = false;
    };
  }, []);

  const foreign = (accounts?.accounts ?? []).filter(
    (a) => a.currency === "USD" || a.currency === "EUR",
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-foreground">Minhas contas</h2>
        {featureFlags.dadosConta && (
          <Link href="/dados-de-conta" className="text-sm font-medium text-primary hover:underline">
            Ver todas
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* BRL highlight — real balance */}
        <div className="rounded-2xl bg-[#011a0f] p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <CurrencyFlag currency="BRL" size={24} />
            <span className="text-sm font-semibold">BRL</span>
          </div>
          <p className="mt-2 font-serif text-2xl font-bold tabular-nums">
            {balance.loading
              ? "…"
              : formatMoney(balance.data?.available ?? 0, {
                  currency: balance.data?.currency ?? "BRL",
                })}
          </p>
          <p className="mt-1 text-xs text-white/60">Disponível para saque via PIX</p>
        </div>

        {foreign.map((a) => (
          <ForeignCard key={a.currency} account={a} />
        ))}
      </div>
    </div>
  );
}
