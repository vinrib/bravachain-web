"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { useBalance, useMe } from "@/lib/hooks";
import { featureFlags } from "@/lib/feature-flags";
import { DepositCardIcon, ReceiveIcon } from "@/components/icons/nav-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/state";
import { AccountMenuSheet } from "@/components/dashboard/account-menu-sheet";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")
  ).toUpperCase() || "—";
}

/**
 * Mobile-only Início hero (Web 14): full-bleed dark card under the status
 * bar, avatar opens the account menu (Configurações/Admin/Sair — there's no
 * "Mais" anymore), action row is Depósito/Enviar(slot)/Receber instead of
 * the desktop card's Sacar via PIX/Receber/Ver extrato (those two now live
 * in the bottom nav). See `WelcomeBalanceCard` for the untouched desktop
 * version — rendered by the page, not this component.
 */
export function WelcomeHeroMobile() {
  const balance = useBalance();
  const me = useMe();
  const t = useTranslations("home.actions");
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const name = me.data?.name?.trim() || null;

  const showDeposito = featureFlags.deposito;
  const showReceber = featureFlags.recebimentos;
  const hasActions = showDeposito || showReceber;

  return (
    <div className="relative overflow-hidden rounded-b-3xl bg-[#011a0f] px-4 pb-6 pt-[max(1.5rem,calc(env(safe-area-inset-top)+0.75rem))] text-white shadow-sm">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[rgba(18,164,107,0.1)]" />
      <div className="relative">
        {/* Greeting — the avatar opens the account menu (Configurações, Admin, Sair). */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex items-center gap-3 text-left"
        >
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
        </button>

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

        {/* Depósito / Enviar (slot, see nav-items.ts) / Receber — one row, same size. */}
        {hasActions && (
          <div className="mt-5 flex gap-3">
            {showDeposito && (
              <Link
                href="/deposito"
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-medium text-white hover:bg-white/10"
              >
                <DepositCardIcon className="h-4 w-4 shrink-0" />
                {t("deposit")}
              </Link>
            )}
            {showReceber && (
              <Link
                href="/instrucoes-de-recebimento"
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-medium text-white hover:bg-white/10"
              >
                <ReceiveIcon className="h-4 w-4 shrink-0" />
                {t("receive")}
              </Link>
            )}
          </div>
        )}
      </div>

      <AccountMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
