"use client";

import { useState } from "react";
import { StatementView, type StatementScope } from "./statement-view";
import { ReceiptsView } from "./receipts-view";
import { TabsPill, type TabItem } from "@/components/ui/tabs-pill";

type Tab = StatementScope | "comprovantes";

/** Extrato with "Em andamento" / "Histórico" / "Comprovantes" tabs (artboard 9a). */
export function ExtratoTabs({ showReceipts = false }: { showReceipts?: boolean }) {
  const [tab, setTab] = useState<Tab>("andamento");
  const [counts, setCounts] = useState({ andamento: 0, historico: 0 });

  const tabs: Array<TabItem<Tab>> = [
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

      <TabsPill tabs={tabs} value={tab} onChange={setTab} />

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
