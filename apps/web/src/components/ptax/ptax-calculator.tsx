"use client";

import { useId, useState } from "react";
import { ArrowLeftRight, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PTAX_CONVERT_CURRENCIES,
  type PtaxConvertCurrency,
} from "@/lib/ptax/constants";
import { PTAX_COPY } from "@/lib/ptax/copy";
import { formatBrasiliaDateTime, formatPtaxDecimal } from "@/lib/ptax/format";
import { usePtaxConvert } from "@/lib/ptax/hooks";

interface PtaxCalculatorProps {
  enabled: boolean;
}

export function PtaxCalculator({ enabled }: PtaxCalculatorProps) {
  const [from, setFrom] = useState<PtaxConvertCurrency>("USD");
  const [to, setTo] = useState<PtaxConvertCurrency>("BRL");
  const [rawAmount, setRawAmount] = useState("1000");

  const amountId = useId();
  const fromId = useId();
  const toId = useId();

  const {
    data,
    loading,
    error,
    featureDisabled,
    inputStatus,
    normalizedAmount,
    reload,
  } = usePtaxConvert(from, to, rawAmount, enabled);

  const consideredDisplayDecimals = (() => {
    if (!normalizedAmount) return 2;
    const dotIdx = normalizedAmount.indexOf(".");
    if (dotIdx === -1) return 2;
    const fracLen = normalizedAmount.length - dotIdx - 1;
    return Math.max(2, Math.min(6, fracLen));
  })();

  // Hidden when flag is OFF OR when the API responds 404 { code: 'feature_disabled' }
  if (!enabled || featureDisabled) {
    return null;
  }

  const handleFromChange = (nextFrom: PtaxConvertCurrency) => {
    if (nextFrom === to) {
      setTo(from);
    }
    setFrom(nextFrom);
  };

  const handleToChange = (nextTo: PtaxConvertCurrency) => {
    if (nextTo === from) {
      setFrom(to);
    }
    setTo(nextTo);
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <Card data-testid="ptax-calculator">
      <CardHeader className="pb-4">
        <CardTitle>{PTAX_COPY.calculator.title}</CardTitle>
        <CardDescription>{PTAX_COPY.calculator.subtitle}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount text input (inputMode=decimal, string-only) */}
        <div className="space-y-1.5">
          <label
            htmlFor={amountId}
            className="text-xs font-medium text-muted-foreground"
          >
            {PTAX_COPY.calculator.amountLabel} ({from})
          </label>
          <Input
            id={amountId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={rawAmount}
            onChange={(e) => setRawAmount(e.target.value)}
            placeholder={PTAX_COPY.calculator.amountPlaceholder}
            aria-invalid={inputStatus === "invalid"}
            className="font-mono tabular-nums"
          />
          {inputStatus === "valid" && normalizedAmount && (
            <p
              data-testid="ptax-calculator-considered"
              className="font-mono text-xs text-muted-foreground tabular-nums"
            >
              {PTAX_COPY.calculator.consideredAmountLabel}:{" "}
              {formatPtaxDecimal(normalizedAmount, consideredDisplayDecimals)}{" "}
              {from}
            </p>
          )}
          {inputStatus === "invalid" && (
            <p
              role="alert"
              data-testid="ptax-calculator-invalid"
              className="text-xs text-destructive"
            >
              {PTAX_COPY.calculator.invalidAmount}
            </p>
          )}
        </div>

        {/* Currency selectors + swap */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="space-y-1.5">
            <label
              htmlFor={fromId}
              className="text-xs font-medium text-muted-foreground"
            >
              {PTAX_COPY.calculator.fromLabel}
            </label>
            <select
              id={fromId}
              value={from}
              onChange={(e) =>
                handleFromChange(e.target.value as PtaxConvertCurrency)
              }
              className="h-10 w-full rounded-xl border border-border bg-input px-3 font-mono text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PTAX_CONVERT_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSwap}
            aria-label={PTAX_COPY.calculator.swapAriaLabel}
            className="h-10 w-10 p-0"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>

          <div className="space-y-1.5">
            <label
              htmlFor={toId}
              className="text-xs font-medium text-muted-foreground"
            >
              {PTAX_COPY.calculator.toLabel}
            </label>
            <select
              id={toId}
              value={to}
              onChange={(e) =>
                handleToChange(e.target.value as PtaxConvertCurrency)
              }
              className="h-10 w-full rounded-xl border border-border bg-input px-3 font-mono text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PTAX_CONVERT_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result box — displays ONLY API `result` */}
        <div
          aria-live="polite"
          aria-atomic="true"
          data-testid="ptax-calculator-result-region"
          className="rounded-xl border border-border bg-muted/40 p-4"
        >
          {inputStatus === "empty" ? (
            <p className="text-xs text-muted-foreground">
              {PTAX_COPY.calculator.emptyPrompt}
            </p>
          ) : inputStatus === "invalid" ? (
            <p className="text-xs text-muted-foreground">
              {PTAX_COPY.header.emptyValue}
            </p>
          ) : loading ? (
            <div className="space-y-2" data-testid="ptax-calculator-loading">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-3.5 w-52" />
            </div>
          ) : error ? (
            <div
              role="alert"
              data-testid="ptax-calculator-error"
              className="flex flex-col items-start gap-2 text-xs"
            >
              <span className="inline-flex items-center gap-1.5 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={reload}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {PTAX_COPY.errors.retry}
              </Button>
            </div>
          ) : data ? (
            <div className="space-y-2" data-testid="ptax-calculator-result">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {PTAX_COPY.calculator.resultLabel}
                </span>
                {data.isCross && (
                  <Badge variant="default">
                    {PTAX_COPY.calculator.crossBadge}
                  </Badge>
                )}
              </div>
              <div className="font-mono text-2xl font-bold text-foreground tabular-nums">
                {formatPtaxDecimal(data.result, 4)} {data.to}
              </div>
              <div className="space-y-0.5 font-mono text-[11px] text-muted-foreground">
                <div>
                  {PTAX_COPY.calculator.rateLabel}: 1 {data.from} ={" "}
                  {formatPtaxDecimal(data.rate, 4)} {data.to}
                </div>
                <div>
                  {PTAX_COPY.calculator.bulletinTimePrefix}
                  {formatBrasiliaDateTime(data.bulletinAt)}
                  {PTAX_COPY.header.lastUpdateTimezone}
                </div>
                <div>{PTAX_COPY.page.sourceLine}</div>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
