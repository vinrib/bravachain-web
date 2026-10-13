"use client";

import { featureFlags } from "@/lib/feature-flags";
import { StatementView } from "@/components/extrato/statement-view";
import { LegacyExtrato } from "@/components/extrato/legacy-extrato";
import { ExtratoTabs } from "@/components/extrato/extrato-tabs";

export default function ExtratoPage() {
  // "Comprovantes" tab wraps the extrato when NEXT_PUBLIC_FEATURE_RECIBOS is on.
  if (featureFlags.recibos) return <ExtratoTabs />;
  // Extrato V2 (/v1/statement) behind its flag; legacy wallet/history is fallback.
  if (featureFlags.extratoV2) return <StatementView />;
  return <LegacyExtrato />;
}
