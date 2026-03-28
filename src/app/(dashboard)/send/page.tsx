"use client";

import { Fragment, useEffect, useState } from "react";
import { Check, ArrowUpDown, FileDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { CURRENCIES, CURRENCY_LIST, FALLBACK_RATES, FIXED_FEE_BRL, SPREAD_RATE } from "@/lib/constants";
import type { Currency, TransferResult } from "@/lib/types";
import { downloadReceipt } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

function formatAmount(value: number, currency: Currency) {
  const info = CURRENCIES[currency];
  if (currency === "BRL") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${info.symbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function StepIndicator({ current, steps }: { current: Step; steps: string[] }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const step = (i + 1) as Step;
        const done = step < current;
        const active = step === current;
        return (
          <Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done ? "bg-primary text-white" :
                  active ? "border-2 border-primary text-primary bg-white" :
                  "border border-border text-muted-foreground bg-white"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step}
              </div>
              <span className={cn(
                "text-xs",
                active ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "h-px flex-1 mx-2 mb-4",
                done ? "bg-primary" : "bg-border"
              )} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

interface DetailRow {
  label: string;
  value: string;
  bold?: boolean;
}

function SummaryRow({ label, value, bold }: DetailRow) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={cn("text-sm", bold ? "font-semibold text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("text-sm text-right", bold ? "font-bold text-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

export default function SendPage() {
  const t = useTranslations("send");
  const { success: toastSuccess } = useToast();
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState<Currency>("BRL");
  const [toCurrency, setToCurrency] = useState<Currency>("USDC");
  const [recipientName, setRecipientName] = useState("");
  const [recipientKey, setRecipientKey] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Debounced amount for live fee breakdown
  const [debouncedAmount, setDebouncedAmount] = useState("");

  // Live rates (fetched from API, fallback to constants)
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);

  // Result
  const [result, setResult] = useState<TransferResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch exchange rates on mount
  useEffect(() => {
    apiFetch<{ rates?: Record<string, number> }>("/v1/rates")
      .then((res) => {
        if (res.rates) setRates((prev) => ({ ...prev, ...res.rates }));
      })
      .catch(() => {}); // keep FALLBACK_RATES
  }, []);

  // Debounce amount by 500ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAmount(amount), 500);
    return () => clearTimeout(timer);
  }, [amount]);

  const getRate = (from: Currency, to: Currency) =>
    rates[`${from}/${to}`] ?? 1;

  // Amounts used for step 2 confirmation (based on actual input)
  const amountNum = parseFloat(amount) || 0;
  const feeInFrom = fromCurrency === "BRL" ? FIXED_FEE_BRL : FIXED_FEE_BRL * getRate("BRL", fromCurrency);
  const spread = amountNum * SPREAD_RATE;
  const netFrom = Math.max(0, amountNum - feeInFrom - spread);
  const amountReceived = netFrom * getRate(fromCurrency, toCurrency);

  // Debounced values for real-time breakdown in step 1
  const dNum = parseFloat(debouncedAmount) || 0;
  const dSpread = dNum * SPREAD_RATE;
  const dNet = Math.max(0, dNum - feeInFrom - dSpread);
  const dReceived = dNet * getRate(fromCurrency, toCurrency);
  const currentRate = getRate(fromCurrency, toCurrency);

  function validateStep1() {
    const errs: Record<string, string> = {};
    if (!amountNum || amountNum <= 0) errs.amount = "Informe um valor válido";
    if (!recipientName.trim()) errs.name = "Informe o nome do destinatário";
    if (!recipientKey.trim()) errs.key = "Informe a chave PIX ou endereço";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await apiFetch<TransferResult>("/v1/transfer", {
        method: "POST",
        body: JSON.stringify({
          amount: amountNum,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          recipient_name: recipientName,
          recipient_key: recipientKey,
        }),
      });
      setResult(res);
      setStep(3);
      toastSuccess("Transferência enviada!");
    } catch {
      setResult({
        id: Math.random().toString(36).slice(2).toUpperCase(),
        status: "pending",
        fee: feeInFrom + spread,
        amount_sent: amountNum,
        amount_received: amountReceived,
        estimated_arrival: "Até 1 dia útil",
      });
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setStep(1);
    setAmount("");
    setDebouncedAmount("");
    setRecipientName("");
    setRecipientKey("");
    setResult(null);
    setErrors({});
  }

  async function handleDownloadReceipt() {
    if (!result) return;
    setDownloadingPdf(true);
    try {
      await downloadReceipt({
        id: result.id,
        date: new Date().toISOString(),
        senderName: "Usuário Bravachain",
        senderEmail: "usuario@bravachain.com",
        recipientName,
        recipientKey,
        amountSent: amountNum,
        fromCurrency,
        amountReceived,
        toCurrency,
        fee: feeInFrom,
        spread,
        exchangeRate: currentRate,
        status: result.status,
        estimatedArrival: result.estimated_arrival,
      });
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <StepIndicator
        current={step}
        steps={[t("steps.details"), t("steps.review"), t("steps.confirmed")]}
      />

      {/* Step 1: Form */}
      {step === 1 && (
        <Card className="p-6 space-y-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t("amount")}</label>
            <div className="flex gap-2">
              <div
                className={cn(
                  "flex flex-1 items-center rounded-xl border bg-input px-4 transition-colors",
                  errors.amount ? "border-destructive" : "border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20"
                )}
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors((p) => ({ ...p, amount: "" }));
                  }}
                  className="flex-1 bg-transparent py-3 text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
                  placeholder={t("amountPlaceholder")}
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                <CurrencyIcon currency={fromCurrency} size="sm" />
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value as Currency)}
                  className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer appearance-none"
                >
                  {CURRENCY_LIST.map((c) => (
                    <option key={c} value={c}>{CURRENCIES[c].flag} {c}</option>
                  ))}
                </select>
              </div>
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* To currency */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t("toCurrency")}</label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
              <CurrencyIcon currency={toCurrency} size="sm" />
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as Currency)}
                className="flex-1 bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer appearance-none"
              >
                {CURRENCY_LIST.map((c) => (
                  <option key={c} value={c}>{CURRENCIES[c].flag} {c} — {CURRENCIES[c].name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recipient */}
          <div className="pt-1 border-t border-border space-y-3">
            <p className="text-sm font-semibold text-foreground">{t("recipient")}</p>
            <Input
              label={t("recipientName")}
              value={recipientName}
              onChange={(e) => {
                setRecipientName(e.target.value);
                setErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder={t("recipientNamePlaceholder")}
              error={errors.name}
            />
            <Input
              label={t("recipientKey")}
              value={recipientKey}
              onChange={(e) => {
                setRecipientKey(e.target.value);
                setErrors((p) => ({ ...p, key: "" }));
              }}
              placeholder={t("recipientKeyPlaceholder")}
              error={errors.key}
            />
          </div>

          {/* Real-time fee breakdown */}
          {dNum > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("feeBreakdown.title")}
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{t("feeBreakdown.youSend")}</span>
                  <span className="font-semibold">{formatAmount(dNum, fromCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("feeBreakdown.spread", { rate: (SPREAD_RATE * 100).toFixed(1) })}
                  </span>
                  <span className="text-destructive">
                    − {formatAmount(dSpread, fromCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("feeBreakdown.networkFee")}</span>
                  <span className="text-destructive">
                    − {formatAmount(feeInFrom, fromCurrency)}
                  </span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-primary">{t("feeBreakdown.recipientReceives")}</span>
                  <span className="text-primary">{formatAmount(dReceived, toCurrency)}</span>
                </div>
                {fromCurrency !== toCurrency && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("feeBreakdown.exchangeRate")}</span>
                    <span>
                      {t("feeBreakdown.rate", {
                        from: fromCurrency,
                        rate: currentRate.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        }),
                        to: toCurrency,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("feeBreakdown.estimatedTime")}</span>
                  <span>{t("feeBreakdown.estimatedTimeValue")}</span>
                </div>
              </div>
            </div>
          )}

          <Button size="lg" className="w-full" onClick={handleNext}>
            {t("continue")}
          </Button>
        </Card>
      )}

      {/* Step 2: Summary */}
      {step === 2 && (
        <Card className="p-6 space-y-4">
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">{t("feeBreakdown.youSend")}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {formatAmount(amountNum, fromCurrency)}
            </p>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border">
            <div className="px-4 py-1">
              <SummaryRow label={t("review.recipient")} value={recipientName} />
              <SummaryRow label={t("review.key")} value={recipientKey} />
            </div>
            <div className="px-4 py-1">
              <SummaryRow label={t("review.amountSent")} value={formatAmount(amountNum, fromCurrency)} />
              <SummaryRow
                label={t("review.spread", { rate: (SPREAD_RATE * 100).toFixed(1) })}
                value={`− ${formatAmount(spread, fromCurrency)}`}
              />
              <SummaryRow label={t("review.fee")} value={`− ${formatAmount(feeInFrom, fromCurrency)}`} />
            </div>
            <div className="px-4 py-1">
              <SummaryRow
                label={t("review.recipientReceives")}
                value={formatAmount(amountReceived, toCurrency)}
                bold
              />
              <SummaryRow label={t("review.deadline")} value={t("review.deadlineValue")} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep(1)}>
              {t("back")}
            </Button>
            <Button size="lg" className="flex-1" onClick={handleConfirm} disabled={submitting}>
              {submitting ? <Spinner size="sm" className="text-white" /> : t("confirm")}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <Card className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t("success.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("success.subtitle")}</p>
          </div>

          {result && (
            <div className="rounded-xl border border-border p-4 text-left space-y-2">
              <SummaryRow label={t("success.txId")} value={`#${result.id}`} />
              <SummaryRow label={t("success.amountSent")} value={formatAmount(amountNum, fromCurrency)} />
              <SummaryRow
                label={t("success.recipientReceives")}
                value={formatAmount(amountReceived, toCurrency)}
                bold
              />
              <SummaryRow label={t("success.deadline")} value={result.estimated_arrival || "Até 1 dia útil"} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="flex-1" onClick={handleReset}>
              {t("newTransfer")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 gap-2"
              onClick={handleDownloadReceipt}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? (
                <Spinner size="sm" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {t("success.downloadReceipt")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
