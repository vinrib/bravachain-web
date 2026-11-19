"use client";

import { CheckCircle2 } from "lucide-react";
import { useKycState } from "@/lib/hooks";
import { KycBanner } from "@/components/dashboard/kyc-banner";
import { MyAccounts } from "@/components/dashboard/my-accounts";
import { WelcomeBalanceCard } from "@/components/dashboard/welcome-balance-card";
import { WelcomeHeroMobile } from "@/components/dashboard/welcome-hero-mobile";
import { RecentPayments } from "@/components/dashboard/recent-payments";
import { EmProcessamento } from "@/components/dashboard/em-processamento";
import { SaqueRapido } from "@/components/dashboard/saque-rapido";

function todayLabel(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const kyc = useKycState();
  const approved = kyc.data?.status === "approved";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Mobile hero (Web 14): bleeds past the page's own padding to reach the
          screen edges and the top safe area; replaces the header + card
          below. Desktop/tablet (md+) render the original header + card
          instead — see the hidden md:flex / md:block blocks below. */}
      <div className="-mx-4 -mt-4 md:hidden">
        <WelcomeHeroMobile />
      </div>

      {/* Header (desktop/tablet only — unchanged) */}
      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
        <div>
          <h1 className="font-serif text-[30px] font-bold text-foreground">Início</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{todayLabel()}</p>
        </div>
        {approved && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#12a46b]/30 bg-[#12a46b]/10 px-3 py-1.5 text-sm font-medium text-[#0b6b4f] dark:text-[#7be0b0]">
            <CheckCircle2 className="h-4 w-4" />
            Empresa verificada
          </span>
        )}
      </div>

      {/* KYB prompt when not approved (real status) */}
      {kyc.data && !approved && <KycBanner status={kyc.data.status} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="hidden md:block">
            <WelcomeBalanceCard />
          </div>
          <MyAccounts />
          {/* Mobile order: "Em processamento" right after "Minhas contas",
              ahead of "Transações recentes" — the desktop instance below
              (in the aside) stays in its original spot. */}
          <div className="md:hidden">
            <EmProcessamento />
          </div>
          <RecentPayments />
        </div>

        <aside className="hidden space-y-6 md:block">
          <EmProcessamento />
          <SaqueRapido />
        </aside>
      </div>
    </div>
  );
}
