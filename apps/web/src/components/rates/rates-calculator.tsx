"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AmountInput } from "@/components/ui/amount-input";
import { TabsPill } from "@/components/ui/tabs-pill";
import { Spinner } from "@/components/ui/spinner";
import { convertRate } from "@/lib/rates/api";
import { formatRate4 } from "./rates-live-cards";
import { PAIRS, type ConvertResult, type RatePair } from "@/lib/rates/types";

function parseAmount(input: string): number | null {
  const cleaned = input.trim().replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatBRL(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function RatesCalculator() {
  const [pair, setPair] = useState<RatePair>("USD_BRL");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const amount = parseAmount(input);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (amount === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(null);
      return;
    }
    let active = true;
    timer.current = setTimeout(() => {
      setLoading(true);
      convertRate(pair, amount)
        .then((r) => {
          if (active) setResult(r);
        })
        .catch(() => {
          if (active) setResult(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 400);
    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pair, amount]);

  const currency = PAIRS.find((p) => p.value === pair)?.currency ?? "";

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <TabsPill
          tabs={PAIRS.map((p) => ({ value: p.value, label: p.label }))}
          value={pair}
          onChange={setPair}
        />

        <div>
          <label className="text-xs text-muted-foreground">Valor em {currency}</label>
          <AmountInput value={input} onChange={setInput} className="mt-1" />
        </div>

        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">Resultado estimado</p>
          {loading ? (
            <div className="mt-1 flex h-8 items-center">
              <Spinner size="sm" />
            </div>
          ) : result && result.result !== null ? (
            <>
              <p className="mt-0.5 font-serif text-2xl font-bold tabular-nums text-foreground">
                {formatBRL(result.result)}
              </p>
              {result.rate !== null && (
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  Taxa usada: R$ {formatRate4(result.rate)}
                </p>
              )}
            </>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Informe um valor para calcular.
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Estimativa sem tarifas nem spread. O valor final aparece na cotação do envio.
        </p>
      </CardContent>
    </Card>
  );
}
