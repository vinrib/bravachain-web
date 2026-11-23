"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowDown, Check, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CurrencyFlag } from "@/components/ui/flags";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PTAX_CONVERT_CURRENCIES,
  PTAX_CURRENCY_META,
  type PtaxConvertCurrency,
} from "@/lib/ptax/constants";
import { PTAX_COPY } from "@/lib/ptax/copy";
import { formatBrasiliaDateTime, formatPtaxDecimal } from "@/lib/ptax/format";
import { usePtaxConvert } from "@/lib/ptax/hooks";
import { cn } from "@/lib/utils";

interface PtaxCalculatorProps {
  enabled: boolean;
}

const SLAB_HEIGHT = 132;
const SLAB_GAP = 8;
const SLAB_PITCH = SLAB_HEIGHT + SLAB_GAP;
const STACK_HEIGHT = SLAB_HEIGHT * 2 + SLAB_GAP;

/**
 * Interactive two-slab PTAX reference calculator ("Asset swap" pattern):
 * - Two stacked rounded slabs with a rotating direction arrow on the seam.
 * - Pressing the arrow rotates +180° continuously and flips direction without
 *   moving the slabs: the slab the arrow leaves is "Valor de origem" (editable)
 *   and the slab it points to is "Valor de referência" (API `result` only).
 * - Clicking a currency pill expands that slab in place to act as the currency
 *   picker (squeezing the neighbor slab); selecting the currency already on the
 *   other slab swaps the two automatically.
 * - Zero client-side financial arithmetic; auto-hides on 404 `feature_disabled`.
 */
export function PtaxCalculator({ enabled }: PtaxCalculatorProps) {
  const [currencies, setCurrencies] = useState<
    [PtaxConvertCurrency, PtaxConvertCurrency]
  >(["USD", "BRL"]);
  const [turns, setTurns] = useState(0);
  const [rawAmount, setRawAmount] = useState("1000");
  const [pick, setPick] = useState<0 | 1 | null>(null);
  const [lifted, setLifted] = useState<0 | 1 | null>(null);

  const amountId = useId();
  const prefersReducedMotion = useReducedMotion();

  const up = turns % 2 === 1;
  const originSlot: 0 | 1 = up ? 1 : 0;
  const targetSlot: 0 | 1 = up ? 0 : 1;
  const from = currencies[originSlot];
  const to = currencies[targetSlot];

  const {
    data,
    loading,
    error,
    featureDisabled,
    inputStatus,
    normalizedAmount,
    reload,
  } = usePtaxConvert(from, to, rawAmount, enabled);

  useEffect(() => {
    if (pick === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPick(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pick]);

  // Hidden when flag is OFF OR when the API responds 404 { code: 'feature_disabled' }
  if (!enabled || featureDisabled) {
    return null;
  }

  const consideredDisplayDecimals = (() => {
    if (!normalizedAmount) return 2;
    const dotIdx = normalizedAmount.indexOf(".");
    if (dotIdx === -1) return 2;
    const fracLen = normalizedAmount.length - dotIdx - 1;
    return Math.max(2, Math.min(6, fracLen));
  })();

  const openPicker = (slot: 0 | 1) => {
    setPick(slot);
    setLifted(slot);
  };

  const closePicker = () => {
    setPick(null);
    if (prefersReducedMotion) {
      setLifted(null);
    }
  };

  const chooseCurrency = (sym: PtaxConvertCurrency) => {
    if (pick === null) return;
    const slot = pick;
    const other: 0 | 1 = slot === 0 ? 1 : 0;
    setCurrencies((prev) => {
      const next: [PtaxConvertCurrency, PtaxConvertCurrency] = [
        prev[0],
        prev[1],
      ];
      if (prev[other] === sym) {
        next[other] = prev[slot];
      }
      next[slot] = sym;
      return next;
    });
    closePicker();
  };

  const growTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.55, bounce: 0.12 };

  const arrowTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.55, bounce: 0.15 };

  const slots: readonly (0 | 1)[] = [0, 1];

  return (
    <Card data-testid="ptax-calculator">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{PTAX_COPY.calculator.title}</CardTitle>
            <CardDescription>{PTAX_COPY.calculator.subtitle}</CardDescription>
          </div>
          {data?.isCross && (
            <Badge variant="default">{PTAX_COPY.calculator.crossBadge}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,400px)_1fr]">
          {/* Interactive two-slab swap stack */}
          <div
            className="relative mx-auto w-full max-w-[400px] md:mx-0"
            style={{ height: STACK_HEIGHT }}
          >
            {slots.map((slot) => {
              const sym = currencies[slot];
              const meta = PTAX_CURRENCY_META[sym];
              const isOrigin = slot === originSlot;
              const isOpen = pick === slot;
              const isSqueezed = pick !== null && !isOpen;
              const roleLabel = isOrigin
                ? PTAX_COPY.calculator.originLabel
                : PTAX_COPY.calculator.resultLabel;

              return (
                <motion.div
                  key={slot}
                  data-testid={`ptax-swap-slab-${slot}`}
                  data-role={isOrigin ? "origin" : "target"}
                  initial={false}
                  animate={{
                    top: isOpen ? 0 : slot * SLAB_PITCH,
                    height: isOpen ? STACK_HEIGHT : SLAB_HEIGHT,
                    scaleY: isSqueezed ? 0.02 : 1,
                    opacity: isSqueezed ? 0 : 1,
                  }}
                  style={{
                    transformOrigin: slot === 0 ? "50% 0%" : "50% 100%",
                  }}
                  transition={{
                    default: growTransition,
                    scaleY: prefersReducedMotion
                      ? { duration: 0 }
                      : { type: "spring", duration: 0.55, bounce: 0 },
                    opacity: prefersReducedMotion
                      ? { duration: 0 }
                      : isSqueezed
                        ? { delay: 0.08, duration: 0.14 }
                        : { delay: 0.05, duration: 0.2 },
                  }}
                  onAnimationComplete={(def) => {
                    if (
                      (def as { height?: number }).height === SLAB_HEIGHT &&
                      pick === null
                    ) {
                      setLifted((current) =>
                        current === slot ? null : current,
                      );
                    }
                  }}
                  role={isOpen ? "dialog" : undefined}
                  aria-label={
                    isOpen
                      ? `${roleLabel}: ${PTAX_COPY.calculator.chooseCurrencyAriaSuffix}`
                      : undefined
                  }
                  className={cn(
                    "absolute inset-x-0 overflow-hidden rounded-[20px] border border-border bg-muted/50 shadow-xs",
                    lifted === slot ? "z-20 bg-card shadow-md" : "z-10",
                  )}
                >
                  {/* Normal slab face */}
                  <motion.div
                    className={cn(
                      "absolute inset-x-0 flex flex-col justify-center gap-1.5 px-4",
                      slot === 0 ? "pt-3 pb-5" : "pt-5 pb-3",
                    )}
                    style={{
                      height: SLAB_HEIGHT,
                      ...(slot === 0 ? { top: 0 } : { bottom: 0 }),
                    }}
                    initial={false}
                    animate={{ opacity: isOpen ? 0 : 1 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : isOpen
                          ? { duration: 0.14 }
                          : { delay: 0.12, duration: 0.2 }
                    }
                    aria-hidden={isOpen || undefined}
                  >
                    {isOrigin ? (
                      <>
                        <label
                          htmlFor={amountId}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          {roleLabel}
                        </label>

                        <div className="flex items-center justify-between gap-2">
                          <input
                            id={amountId}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={rawAmount}
                            onChange={(e) => setRawAmount(e.target.value)}
                            placeholder={PTAX_COPY.calculator.amountPlaceholder}
                            aria-label={`${PTAX_COPY.calculator.amountLabel} (${sym})`}
                            aria-invalid={inputStatus === "invalid"}
                            tabIndex={pick === null ? 0 : -1}
                            className="w-full min-w-0 bg-transparent font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums outline-none placeholder:text-muted-foreground/50 sm:text-[26px]"
                          />

                          <button
                            type="button"
                            data-testid={`ptax-currency-pill-${slot}`}
                            onClick={() => openPicker(slot)}
                            tabIndex={pick === null ? 0 : -1}
                            aria-label={`${meta.name}. ${PTAX_COPY.calculator.chooseCurrencyAriaSuffix}`}
                            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <CurrencyFlag currency={sym} size={22} />
                            <span>{sym}</span>
                          </button>
                        </div>

                        <div className="min-h-[16px]">
                          {inputStatus === "valid" && normalizedAmount ? (
                            <p
                              data-testid="ptax-calculator-considered"
                              className="truncate font-mono text-[11px] text-muted-foreground tabular-nums"
                            >
                              {PTAX_COPY.calculator.consideredAmountLabel}:{" "}
                              {formatPtaxDecimal(
                                normalizedAmount,
                                consideredDisplayDecimals,
                              )}{" "}
                              {sym}
                            </p>
                          ) : inputStatus === "invalid" ? (
                            <p
                              role="alert"
                              data-testid="ptax-calculator-invalid"
                              className="truncate text-[11px] text-destructive"
                            >
                              {PTAX_COPY.calculator.invalidAmount}
                            </p>
                          ) : (
                            <p className="truncate text-[11px] text-muted-foreground">
                              {PTAX_COPY.calculator.emptyPrompt}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div
                        aria-live="polite"
                        aria-atomic="true"
                        data-testid="ptax-calculator-result-region"
                        className="flex flex-col justify-center gap-1.5"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {roleLabel}
                        </span>

                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {inputStatus === "empty" ||
                            inputStatus === "invalid" ? (
                              <span className="font-mono text-2xl font-bold text-muted-foreground tabular-nums sm:text-[26px]">
                                {PTAX_COPY.header.emptyValue}
                              </span>
                            ) : loading ? (
                              <Skeleton
                                className="h-8 w-36"
                                data-testid="ptax-calculator-loading"
                              />
                            ) : error ? (
                              <div
                                role="alert"
                                data-testid="ptax-calculator-error"
                                className="flex items-center gap-1.5 text-xs text-destructive"
                              >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span className="truncate">{error}</span>
                              </div>
                            ) : data ? (
                              <span
                                data-testid="ptax-calculator-result"
                                className="block truncate font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-[26px]"
                              >
                                {formatPtaxDecimal(data.result, 4)}
                              </span>
                            ) : (
                              <span className="font-mono text-2xl font-bold text-muted-foreground tabular-nums sm:text-[26px]">
                                {PTAX_COPY.header.emptyValue}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            data-testid={`ptax-currency-pill-${slot}`}
                            onClick={() => openPicker(slot)}
                            tabIndex={pick === null ? 0 : -1}
                            aria-label={`${meta.name}. ${PTAX_COPY.calculator.chooseCurrencyAriaSuffix}`}
                            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <CurrencyFlag currency={sym} size={22} />
                            <span>{sym}</span>
                          </button>
                        </div>

                        <div className="min-h-[16px]">
                          {error ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={reload}
                              className="h-auto min-h-0 gap-1 p-0 text-[11px] font-medium text-foreground underline"
                            >
                              <RefreshCw className="h-3 w-3" />
                              {PTAX_COPY.errors.retry}
                            </Button>
                          ) : data ? (
                            <p className="truncate font-mono text-[11px] text-muted-foreground tabular-nums">
                              1 {data.from} = {formatPtaxDecimal(data.rate, 4)}{" "}
                              {data.to}
                            </p>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {meta.name}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Inline expanding currency picker inside the same slab */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        data-testid="ptax-currency-picker"
                        className="flex h-full flex-col p-3.5"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          transition: prefersReducedMotion
                            ? { duration: 0 }
                            : { delay: 0.08, duration: 0.18 },
                        }}
                        exit={{
                          opacity: 0,
                          transition: prefersReducedMotion
                            ? { duration: 0 }
                            : { duration: 0.12 },
                        }}
                      >
                        <div className="mb-2 flex items-center justify-between px-1">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {roleLabel}
                          </span>
                          <button
                            type="button"
                            onClick={closePicker}
                            aria-label={
                              PTAX_COPY.calculator.closePickerAriaLabel
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex flex-1 flex-col justify-center gap-1.5">
                          {PTAX_CONVERT_CURRENCIES.map((code) => {
                            const optionMeta = PTAX_CURRENCY_META[code];
                            const selected = currencies[slot] === code;
                            return (
                              <button
                                key={code}
                                type="button"
                                data-testid={`ptax-picker-option-${code}`}
                                onClick={() => chooseCurrency(code)}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                                  selected
                                    ? "bg-muted font-semibold text-foreground"
                                    : "text-foreground hover:bg-muted/60",
                                )}
                              >
                                <CurrencyFlag currency={code} size={24} />
                                <span className="font-mono text-sm font-semibold">
                                  {code}
                                </span>
                                <span className="flex-1 text-xs text-muted-foreground">
                                  {optionMeta.name}
                                </span>
                                {selected && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Centered rotating direction arrow on the seam */}
            <motion.button
              type="button"
              data-testid="ptax-swap-direction"
              initial={false}
              animate={{
                rotate: turns * 180,
                scale: lifted === null ? 1 : 0.5,
                opacity: lifted === null ? 1 : 0,
              }}
              transition={{
                default: arrowTransition,
                scale: prefersReducedMotion
                  ? { duration: 0 }
                  : lifted === null
                    ? { type: "spring", duration: 0.4, bounce: 0.3 }
                    : { duration: 0.14 },
                opacity: prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: lifted === null ? 0.18 : 0.1 },
              }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              onClick={() => setTurns((n) => n + 1)}
              tabIndex={pick === null ? 0 : -1}
              aria-label={`${PTAX_COPY.calculator.swapAriaLabel} (${from} para ${to})`}
              className="absolute left-1/2 top-1/2 z-30 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-card bg-muted text-foreground shadow-sm transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowDown className="h-4 w-4" strokeWidth={2.2} />
            </motion.button>
          </div>

          {/* Reference details & regulatory attribution */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-4 text-xs">
            <div className="space-y-2.5">
              <div className="font-semibold text-foreground">
                {PTAX_COPY.calculator.rateLabel}
              </div>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : data ? (
                <div className="space-y-1.5 font-mono text-muted-foreground">
                  <div className="text-sm font-semibold text-foreground tabular-nums">
                    1 {data.from} = {formatPtaxDecimal(data.rate, 4)} {data.to}
                  </div>
                  <div>
                    {PTAX_COPY.calculator.bulletinTimePrefix}
                    {formatBrasiliaDateTime(data.bulletinAt)}
                    {PTAX_COPY.header.lastUpdateTimezone}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {inputStatus === "invalid"
                    ? PTAX_COPY.calculator.invalidAmount
                    : PTAX_COPY.calculator.emptyPrompt}
                </p>
              )}
            </div>

            <div className="border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
              {PTAX_COPY.page.sourceLine}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
