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

/** Desktop card (unchanged from before): receiving instructions for USD/EUR. */
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

/** Compact mobile card (Marcia Alves mockup): ~183×146, flag + code, serif
 *  "Instruções de recebimento", masked mono line. Links to the receiving
 *  instructions for that currency. */
function ForeignCardMobile({ account }: { account: DedicatedAccount }) {
  return (
    <Link
      href="/instrucoes-de-recebimento"
      className="flex h-[146px] w-[183px] shrink-0 snap-start flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center gap-2">
        <CurrencyFlag currency={account.currency} size={25} />
        <span className="text-sm font-semibold text-foreground">{account.currency}</span>
      </div>
      <p className="mt-2 font-serif text-base font-bold leading-snug text-foreground">
        Instruções de recebimento
      </p>
      <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
        <Landmark className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-mono">{masked(account) ?? account.bankName ?? "—"}</span>
      </div>
    </Link>
  );
}

/** Empty-state mobile card — same footprint, no invented number. */
function EmptyCardMobile() {
  return (
    <div className="flex h-[146px] w-[183px] shrink-0 snap-start flex-col justify-center rounded-2xl border border-dashed border-border bg-card p-4 text-xs text-muted-foreground">
      <p className="font-serif text-base font-bold leading-snug text-foreground">Contas internacionais</p>
      <p className="mt-1">As contas em dólar e euro aparecem aqui quando estiverem prontas.</p>
    </div>
  );
}

function SkeletonCardMobile() {
  return (
    <div className="h-[146px] w-[183px] shrink-0 snap-start animate-pulse rounded-2xl border border-border bg-muted/40" />
  );
}

/**
 * "Minhas contas" (Web 14 v3). Mobile: a snap carousel of USD/EUR receiving
 * cards only — the BRL balance already lives in the hero, so no BRL card here
 * (that was the v2 mistake). USD/EUR appear only when `/v1/receive/accounts`
 * returns them; otherwise an empty-state card with no invented number. Desktop
 * (md+) keeps its original grid: the BRL highlight plus USD/EUR.
 */
export function MyAccounts() {
  const balance = useBalance();
  const [accounts, setAccounts] = useState<AccountsResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getAccounts()
      .then((d) => {
        if (active) setAccounts(d);
      })
      .catch(() => {
        /* no dedicated account yet — mobile shows the empty-state card */
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const foreign = (accounts?.accounts ?? []).filter(
    (a) => a.currency === "USD" || a.currency === "EUR",
  );

  // Desktop (unchanged): BRL highlight + foreign cards.
  const desktopCards = [
    <div key="BRL" className="rounded-2xl bg-[#011a0f] p-5 text-white shadow-sm">
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
    </div>,
    ...foreign.map((a) => <ForeignCard key={a.currency} account={a} />),
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-foreground">Minhas contas</h2>
        {/* Mobile: always a link (mockup). Desktop: unchanged (flag-gated). */}
        <Link
          href="/dados-de-conta"
          className="text-sm font-medium text-primary hover:underline md:hidden"
        >
          Ver todas
        </Link>
        {featureFlags.dadosConta && (
          <Link
            href="/dados-de-conta"
            className="hidden text-sm font-medium text-primary hover:underline md:inline"
          >
            Ver todas
          </Link>
        )}
      </div>

      {/* Mobile: USD/EUR only, snap carousel with the next card peeking. */}
      <div
        data-testid="accounts-mobile"
        className="-mx-4 flex snap-x snap-mandatory gap-[11px] overflow-x-auto px-4 pb-1 md:hidden"
      >
        {!loaded ? (
          <>
            <SkeletonCardMobile />
            <SkeletonCardMobile />
          </>
        ) : foreign.length > 0 ? (
          foreign.map((a) => <ForeignCardMobile key={a.currency} account={a} />)
        ) : (
          <EmptyCardMobile />
        )}
      </div>

      {/* Tablet/desktop: unchanged grid. */}
      <div data-testid="accounts-desktop" className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
        {desktopCards}
      </div>
    </div>
  );
}
