"use client";

import { useState } from "react";
import { TabsPill } from "@/components/ui/tabs-pill";
import { useLiveRates } from "@/lib/rates/use-live-rates";
import { RatesLiveCards } from "@/components/rates/rates-live-cards";
import { RatesChart } from "@/components/rates/rates-chart";
import { RatesCalculator } from "@/components/rates/rates-calculator";
import { RatesAlerts } from "@/components/rates/rates-alerts";

type Tool = "calc" | "alerts";

export default function CotacoesPage() {
  const live = useLiveRates();
  const [tool, setTool] = useState<Tool>("calc");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Cotações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Taxas de referência de mercado e simulação de conversão.
        </p>
      </div>

      <RatesLiveCards
        data={live.data}
        loading={live.loading}
        error={live.error}
        onRetry={live.reload}
      />

      <RatesChart />

      {/* Calculator + Alerts: side by side on desktop, tabs on mobile */}
      <div className="lg:hidden">
        <TabsPill
          tabs={[
            { value: "calc", label: "Calculadora" },
            { value: "alerts", label: "Alertas" },
          ]}
          value={tool}
          onChange={setTool}
          className="mb-4"
        />
        {tool === "calc" ? <RatesCalculator /> : <RatesAlerts />}
      </div>
      <div className="hidden gap-6 lg:grid lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">Calculadora</h2>
          <RatesCalculator />
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">Alertas</h2>
          <RatesAlerts />
        </div>
      </div>

      {/* Indicative-rate notice (fixed) */}
      <p className="text-xs text-muted-foreground">
        Taxas de referência de mercado, apenas para consulta. A taxa de uma operação é
        definida na cotação no momento do envio.
      </p>
    </div>
  );
}
