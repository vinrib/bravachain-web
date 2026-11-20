"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowDownToLine, ArrowLeftRight, Bell, Eye, EyeOff, Landmark } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { cn } from "@/lib/utils";
import { useBalance, useMe } from "@/lib/hooks";
import { featureFlags } from "@/lib/feature-flags";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/state";
import { AccountMenuSheet } from "@/components/dashboard/account-menu-sheet";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")
  ).toUpperCase() || "—";
}

/** Header action chip: an enabled Link, or a visually-identical disabled
 *  control (`aria-disabled`, no navigation) when its feature flag is off —
 *  the mockup keeps all three buttons regardless of availability. */
function HeroAction({
  label,
  href,
  enabled,
  icon: Icon,
}: {
  label: string;
  href: string;
  enabled: boolean;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  const className = cn(
    "flex min-h-[48px] flex-1 min-w-0 items-center justify-center gap-1.5 rounded-[14px]",
    "border border-white/15 bg-white/5 px-2 text-[13px] font-medium text-white",
  );
  const inner = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </>
  );
  if (!enabled) {
    return (
      <div className={cn(className, "cursor-default select-none")} aria-disabled="true">
        {inner}
      </div>
    );
  }
  return (
    <Link href={href} className={cn(className, "transition-colors hover:bg-white/10")}>
      {inner}
    </Link>
  );
}

/**
 * Mobile-only Início hero (Web 14 v3 — Marcia Alves mockup): full-bleed dark
 * card under the status bar. Avatar opens the account menu (Configurações /
 * Área administrativa / Sair — the only mobile path to admin + logout). Bell is
 * decorative (`aria-hidden`, no dot) because there is no notifications feature.
 * Three equal action chips Depósito / Transferir / Receber. The desktop card
 * (`WelcomeBalanceCard`) is untouched and rendered by the page on md+.
 */
export function WelcomeHeroMobile() {
  const balance = useBalance();
  const me = useMe();
  const t = useTranslations("home.actions");
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const name = me.data?.name?.trim() || null;

  return (
    <div
      className="relative overflow-hidden rounded-b-3xl bg-[#011a0f] px-5 pb-6 pt-[max(1.5rem,calc(env(safe-area-inset-top)+0.75rem))] text-white shadow-sm"
      style={{
        // Subtle top-right glow painted as a background (no overflowing child
        // element, so it never trips the no-horizontal-scroll check).
        backgroundImage:
          "radial-gradient(120% 90% at 92% -20%, rgba(18,164,107,0.18), transparent 55%)",
      }}
    >
      <div className="relative">
        {/* Greeting row: avatar (opens account menu) + name, decorative bell. */}
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {name ? initials(name) : "—"}
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-white/60">Seja bem-vindo(a)</span>
              {name ? (
                <span className="block font-serif text-xl font-bold leading-tight">{name}</span>
              ) : (
                <Skeleton className="mt-1 block h-4 w-28 bg-white/10" />
              )}
            </span>
          </button>
          <span
            aria-hidden="true"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80"
          >
            <Bell className="h-5 w-5" />
          </span>
        </div>

        {/* Balance + eye */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-white/70">Saldo disponível · reais</p>
            {balance.loading ? (
              <Skeleton className="mt-2 h-10 w-48 bg-white/10" />
            ) : balance.error ? (
              <div className="mt-3">
                <ErrorState message={balance.error} onRetry={balance.reload} />
              </div>
            ) : (
              <p className="mt-1 font-serif text-[40px] font-bold leading-none tabular-nums">
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
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:text-white"
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Three equal actions — Depósito / Transferir / Receber. */}
        <div className="mt-5 flex gap-[7px]">
          <HeroAction
            label={t("deposit")}
            href="/deposito"
            enabled={featureFlags.deposito}
            icon={Landmark}
          />
          <HeroAction
            label={t("transfer")}
            href="/enviar"
            enabled={featureFlags.enviar}
            icon={ArrowLeftRight}
          />
          <HeroAction
            label={t("receive")}
            href="/instrucoes-de-recebimento"
            enabled
            icon={ArrowDownToLine}
          />
        </div>
      </div>

      <AccountMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
