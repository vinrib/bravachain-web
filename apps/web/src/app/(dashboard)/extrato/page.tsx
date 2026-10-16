"use client";

import { featureFlags } from "@/lib/feature-flags";
import { LegacyExtrato } from "@/components/extrato/legacy-extrato";
import { ExtratoTabs } from "@/components/extrato/extrato-tabs";

export default function ExtratoPage() {
  // Extrato V2 (artboard 9a): tabbed table view. Legacy wallet/history is the
  // fallback when the flag is off.
  if (featureFlags.extratoV2) {
    return <ExtratoTabs showReceipts={featureFlags.recibos} />;
  }
  return <LegacyExtrato />;
}
