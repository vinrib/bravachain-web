"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import {
  CURRENCIES,
  CURRENCY_LIST,
  FALLBACK_RATES,
  FIXED_FEE_BRL,
  SPREAD_RATE,
} from "@/lib/constants";
import type { Currency, RatesResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { RateChart } from "@/components/ui/rate-chart";
import { useToast } from "@/components/toast-provider";

function formatAmount(value: number, currency: Currency) {
  const decimals = currency === "BRL" ? 2 : 4;
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
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
        style={{ minWidth: 56 }}
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
  const [swapRotation, setSwapRotation] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<RatesResponse>("/v1/rates")
      .then((res) => {
        if (res.rates) setRates({ ...FALLBACK_RATES, ...res.rates });
      })
      .catch(() => {
        /* use fallback */
      })
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
  const feeInFrom =
    fromCurrency === "BRL"
      ? FIXED_FEE_BRL
      : FIXED_FEE_BRL * getRate("BRL", fromCurrency);
  const fromNum = parseFloat(fromAmount) || 0;
  const spreadAmount = fromNum * SPREAD_RATE;
  const netFrom = Math.max(0, fromNum - feeInFrom - spreadAmount);
  const calculatedTo = netFrom * currentRate;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setToAmount(calculatedTo > 0 ? formatAmount(calculatedTo, toCurrency) : "");
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fromAmount, fromCurrency, toCurrency, calculatedTo]);

  function swapCurrencies() {
    setSwapRotation((r) => r + 180);
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
      success(
        "Conversão realizada!",
        `${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}`
      );
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erro ao converter");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Converter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Taxas em tempo real, câmbio justo
        </p>
      </motion.div>

      {/* Main converter card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <Card>
          <div className="p-4 sm:p-5 space-y-2">
            {/* From */}
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Você envia
                </span>
                <CurrencySelect
                  value={fromCurrency}
                  onChange={setFromCurrency}
                  label="Moeda de origem"
                />
              </div>
              <input
                type="number"
                inputMode="decimal"
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

            {/* Swap button — animated */}
            <div className="flex justify-center">
              <button
                onClick={swapCurrencies}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted transition-colors"
                aria-label="Inverter moedas"
              >
                <motion.div
                  animate={{ rotate: swapRotation }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </button>
            </div>

            {/* To */}
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Destinatário recebe
                </span>
                <CurrencySelect
                  value={toCurrency}
                  onChange={setToCurrency}
                  label="Moeda de destino"
                />
              </div>
              <p className="text-3xl font-bold text-foreground min-h-[36px]">
                {loadingRates ? <Spinner size="sm" /> : toAmount || "0"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {CURRENCIES[toCurrency].name}
              </p>
            </div>
          </div>

          {/* Rate details */}
          <div className="border-t border-border px-4 sm:px-5 py-4 space-y-2">
            {[
              {
                label: "Taxa de câmbio",
                value: `1 ${fromCurrency} = ${formatAmount(currentRate, toCurrency)} ${toCurrency}`,
              },
              {
                label: `Spread (${(SPREAD_RATE * 100).toFixed(1)}%)`,
                value: `${formatAmount(spreadAmount, fromCurrency)} ${fromCurrency}`,
              },
              {
                label: "Tarifa fixa",
                value: `${formatAmount(feeInFrom, fromCurrency)} ${fromCurrency}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm border-t border-border pt-2 mt-2">
              <span className="font-medium text-foreground">Total debitado</span>
              <span className="font-bold text-foreground">
                {formatAmount(fromNum, fromCurrency)} {fromCurrency}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recharts rate chart */}
      {fromCurrency !== toCurrency && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          <Card className="p-4 sm:p-5">
            <RateChart fromCurrency={fromCurrency} toCurrency={toCurrency} />
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Button
          size="xl"
          className="w-full"
          onClick={handleConvert}
          disabled={submitting || fromNum <= 0 || fromCurrency === toCurrency}
        >
          {submitting ? (
            <Spinner size="sm" className="text-primary-foreground" />
          ) : (
            `Converter ${fromAmount || "0"} ${fromCurrency}`
          )}
        </Button>
      </motion.div>
    </div>
  );
}
