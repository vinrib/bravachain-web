"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StatementView, type StatementScope } from "./statement-view";
import { ReceiptsView } from "./receipts-view";

type Tab = StatementScope | "comprovantes";

/** Extrato with "Em andamento" / "Histórico" / "Comprovantes" tabs (artboard 9a). */
export function ExtratoTabs({ showReceipts = false }: { showReceipts?: boolean }) {
  const [tab, setTab] = useState<Tab>("andamento");
  const [counts, setCounts] = useState({ andamento: 0, historico: 0 });

  const tabs: Array<{ value: Tab; label: string; badge?: number }> = [
    { value: "andamento", label: "Em andamento", badge: counts.andamento },
    { value: "historico", label: "Histórico", badge: counts.historico },
    ...(showReceipts
      ? [{ value: "comprovantes" as Tab, label: "Comprovantes" }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Extrato</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pagamentos recebidos do exterior e saques via PIX, com o valor final em reais.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "comprovantes" ? (
        <ReceiptsView embedded />
      ) : (
        <StatementView
          scope={tab}
          onViewReceipts={showReceipts ? () => setTab("comprovantes") : undefined}
          onCounts={setCounts}
        />
      )}
    </div>
  );
}
