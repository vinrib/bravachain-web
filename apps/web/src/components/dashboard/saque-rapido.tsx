"use client";

import Link from "next/link";
import { ArrowRight, Banknote } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { Card, CardContent } from "@/components/ui/card";
import { useBalance } from "@/lib/hooks";

/** Sidebar "Saque rápido": available balance + CTA to the withdrawal screen. */
export function SaqueRapido() {
  const balance = useBalance();

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-2 flex items-center gap-2">
          <Banknote className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Saque rápido</p>
        </div>
        <p className="text-xs text-muted-foreground">Disponível para saque</p>
        <p className="mt-0.5 font-serif text-2xl font-bold tabular-nums text-foreground">
          {balance.loading
            ? "…"
            : formatMoney(balance.data?.available ?? 0, {
                currency: balance.data?.currency ?? "BRL",
              })}
        </p>
        <Link
          href="/saque"
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#011a0f] text-sm font-semibold text-white hover:bg-[#0b3b2e] dark:bg-primary dark:text-primary-foreground"
        >
          Sacar via PIX
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
