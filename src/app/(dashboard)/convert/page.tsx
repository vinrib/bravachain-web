"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpDown, Info } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { CURRENCIES, CURRENCY_LIST, FALLBACK_RATES, FIXED_FEE_BRL, SPREAD_RATE } from "@/lib/constants";
import type { Currency, RatesResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

function formatAmount(value: number, currency: Currency) {
  const decimals = currency === "BRL" ? 2 : 4;
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

// Simple SVG sparkline
function Sparkline({ data, color = "#00b67a" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 300;
  const H = 48;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * H * 0.8 - H * 0.1;
      return `${x},${y}`;
    })
    .join(" ");
  const lastX = W;
  const lastY = H - ((data[data.length - 1] - min) / range) * H * 0.8 - H * 0.1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

function generateMockHistory(baseRate: number): number[] {
  const data = [baseRate];
  for (let i = 1; i < 30; i++) {
    const prev = data[i - 1];
    const delta = (Math.random() - 0.5) * 0.04 * prev;
    data.push(Math.max(0.001, prev + delta));
  }
  return data;
}

interface CurrencySelectProps {
  value: Currency;
  onChange: (c: Currency) => void;
  label: string;
}

function CurrencySelect({ value, onChange, label }: CurrencySelectProps) {
  return (
    <div className="flex items-center gap-1.5">
      <CurrencyIcon currency={value} size="sm" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as Currency)}
        className="bg-transparent border-0 text-sm font-bold text-foreground focus:outline-none cursor-pointer pr-1 appearance-none"
        style={{ minWidth: 60 }}
      >
        {CURRENCY_LIST.map((c) => (
          <option key={c} value={c}>
            {CURRENCIES[c].flag} {c}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ConvertPage() {
  const { success, error: toastError } = useToast();
  const [fromCurrency, setFromCurrency] = useState<Currency>("BRL");
  const [toCurrency, setToCurrency] = useState<Currency>("USDC");
  const [fromAmount, setFromAmount] = useState("100");
  const [toAmount, setToAmount] = useState("");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [loadingRates, setLoadingRates] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sparkData, setSparkData] = useState<number[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<RatesResponse>("/v1/rates")
      .then((res) => {
        if (res.rates) setRates({ ...FALLBACK_RATES, ...res.rates });
      })
      .catch(() => {/* use fallback */})
      .finally(() => setLoadingRates(false));
  }, []);

  const getRate = useCallback(
    (from: Currency, to: Currency) => {
      const key = `${from}/${to}`;
      return rates[key] ?? FALLBACK_RATES[key] ?? 1;
    },
    [rates]
  );

  const currentRate = getRate(fromCurrency, toCurrency);
  const feeInFrom = fromCurrency === "BRL" ? FIXED_FEE_BRL : FIXED_FEE_BRL * getRate("BRL", fromCurrency);
  const fromNum = parseFloat(fromAmount) || 0;
  const spreadAmount = fromNum * SPREAD_RATE;
  const netFrom = Math.max(0, fromNum - feeInFrom - spreadAmount);
  const calculatedTo = netFrom * currentRate;

  useEffect(() => {
    setSparkData(generateMockHistory(currentRate));
  }, [fromCurrency, toCurrency, currentRate]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setToAmount(calculatedTo > 0 ? formatAmount(calculatedTo, toCurrency) : "");
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fromAmount, fromCurrency, toCurrency, calculatedTo]);

  function swapCurrencies() {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount.replace(/\./g, "").replace(",", "."));
  }

  async function handleConvert() {
    if (fromNum <= 0) { toastError("Informe um valor válido"); return; }
    if (fromCurrency === toCurrency) { toastError("Escolha moedas diferentes"); return; }
    setSubmitting(true);
    try {
      await apiFetch("/v1/convert", {
        method: "POST",
        body: JSON.stringify({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          amount: fromNum,
        }),
      });
      success("Conversão realizada!", `${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao converter");
    } finally {
      setSubmitting(false);
    }
  }

  const rateChange = sparkData.length >= 2
    ? ((sparkData[sparkData.length - 1] - sparkData[0]) / sparkData[0]) * 100
    : 0;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Converter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Taxas em tempo real, câmbio justo
        </p>
      </div>

      {/* Main converter card */}
      <Card>
        <div className="p-5 space-y-2">
          {/* From */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Você envia
              </span>
              <CurrencySelect value={fromCurrency} onChange={setFromCurrency} label="Moeda de origem" />
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {CURRENCIES[fromCurrency].name}
            </p>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={swapCurrencies}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted transition-colors"
              aria-label="Inverter moedas"
            >
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* To */}
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Destinatário recebe
              </span>
              <CurrencySelect value={toCurrency} onChange={setToCurrency} label="Moeda de destino" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {loadingRates ? (
                <Spinner size="sm" />
              ) : toAmount || "0"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {CURRENCIES[toCurrency].name}
            </p>
          </div>
        </div>

        {/* Rate details */}
        <div className="border-t border-border px-5 py-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de câmbio</span>
            <span className="font-medium text-foreground">
              1 {fromCurrency} = {formatAmount(currentRate, toCurrency)} {toCurrency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              Spread ({(SPREAD_RATE * 100).toFixed(1)}%)
            </span>
            <span className="font-medium text-foreground">
              {formatAmount(spreadAmount, fromCurrency)} {fromCurrency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tarifa fixa</span>
            <span className="font-medium text-foreground">
              {formatAmount(feeInFrom, fromCurrency)} {fromCurrency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-border pt-2 mt-2">
            <span className="font-medium text-foreground">Total debitado</span>
            <span className="font-bold text-foreground">
              {formatAmount(fromNum, fromCurrency)} {fromCurrency}
            </span>
          </div>
        </div>
      </Card>

      {/* Sparkline chart */}
      {sparkData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Taxa {fromCurrency}/{toCurrency} — últimos 30 dias
              </CardTitle>
              <span
                className={cn(
                  "text-xs font-semibold",
                  rateChange >= 0 ? "text-green-600" : "text-red-500"
                )}
              >
                {rateChange >= 0 ? "+" : ""}{rateChange.toFixed(2)}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Sparkline data={sparkData} />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>30 dias atrás</span>
              <span>Hoje</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        size="xl"
        className="w-full"
        onClick={handleConvert}
        disabled={submitting || fromNum <= 0 || fromCurrency === toCurrency}
      >
        {submitting ? (
          <Spinner size="sm" className="text-white" />
        ) : (
          `Enviar ${fromAmount || "0"} ${fromCurrency}`
        )}
      </Button>
    </div>
  );
}
