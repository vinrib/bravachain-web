"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote, Eye, EyeOff, Receipt } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { useBalance, useMe } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/state";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase() || "—";
}

/** Dark welcome card with the BRL balance (Início hero), per artboard 4a. */
export function WelcomeBalanceCard() {
  const balance = useBalance();
  const me = useMe();
  const [hidden, setHidden] = useState(false);
  const name = me.data?.name?.trim() || null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#011a0f] p-6 text-white shadow-sm">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[rgba(18,164,107,0.1)]" />
      <div className="relative">
        {/* Greeting */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
            {name ? initials(name) : "—"}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-white/60">Bem-vindo(a)</p>
            {name ? (
              <p className="truncate font-serif text-base font-bold">{name}</p>
            ) : (
              <Skeleton className="h-4 w-28 bg-white/10" />
            )}
          </div>
        </div>

        {/* Balance */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-white/70">Saldo disponível · reais</p>
            {balance.loading ? (
              <Skeleton className="mt-2 h-10 w-48 bg-white/10" />
            ) : balance.error ? (
              <div className="mt-3">
                <ErrorState message={balance.error} onRetry={balance.reload} />
              </div>
            ) : (
              <p className="mt-1 font-serif text-4xl font-bold tabular-nums">
                {hidden
                  ? "••••••"
                  : formatMoney(balance.data?.available ?? 0, {
                      currency: balance.data?.currency ?? "BRL",
                    })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setHidden((h) => !h)}
            aria-label={hidden ? "Mostrar saldo" : "Ocultar saldo"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:text-white"
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Actions — only screens that exist */}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/saque"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Banknote className="h-4 w-4" />
            Sacar via PIX
          </Link>
          <Link
            href="/extrato"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-medium text-white hover:bg-white/10"
          >
            <Receipt className="h-4 w-4" />
            Ver extrato
          </Link>
        </div>
      </div>
    </div>
  );
}
