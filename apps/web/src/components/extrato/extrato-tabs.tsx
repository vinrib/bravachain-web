"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { featureFlags } from "@/lib/feature-flags";
import { StatementView } from "./statement-view";
import { LegacyExtrato } from "./legacy-extrato";
import { ReceiptsView } from "./receipts-view";

type Tab = "extrato" | "comprovantes";

const TABS: Array<{ value: Tab; label: string }> = [
  { value: "extrato", label: "Movimentações" },
  { value: "comprovantes", label: "Comprovantes" },
];

/** Extrato with a "Comprovantes" tab (NEXT_PUBLIC_FEATURE_RECIBOS). */
export function ExtratoTabs() {
  const [tab, setTab] = useState<Tab>("extrato");

  const extrato = featureFlags.extratoV2 ? (
    <StatementView embedded onViewReceipts={() => setTab("comprovantes")} />
  ) : (
    <LegacyExtrato embedded />
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Extrato</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Movimentações e comprovantes da conta
        </p>
      </div>

      <div className="inline-flex gap-1 rounded-xl border border-border p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "extrato" ? extrato : <ReceiptsView embedded />}
    </div>
  );
}
