"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatMoney } from "@bravachain/shared";
import { ArrowRight, Info, RefreshCw } from "lucide-react";
import { featureFlags } from "@/lib/feature-flags";
import { ApiError } from "@/lib/client-api";
import { CurrencyFlag } from "@/components/ui/flags";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuote } from "@/lib/send/use-quote";
import { remainingSeconds, formatCountdown } from "@/lib/deposit/status";
import type { SendCurrency, SendQuote } from "@/lib/send/types";

const SYMBOL: Record<SendCurrency, string> = { BRL: "R$", USD: "US$", EUR: "€" };
const RAIL: Record<SendCurrency, string> = { BRL: "Pix", USD: "Wire", EUR: "SEPA" };
const QUOTE_SECONDS = 300;

const formatNum = (n: number): string =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parseDigits = (s: string): number => {
  const d = s.replace(/\D/g, "");
  return d ? Number(d) / 100 : 0;
};
const money = (n: number, currency: SendCurrency): string => formatMoney(n, { currency });

/**
 * Step 2: amount + live estimate. BRL fixes the amount you send; USD/EUR let the
 * user fix either side. Everything shown comes from the quote — the front never
 * validates its own ceiling (uses `enoughBalance`); limits/refusals are Avenia's.
 */
export function AmountStep({
  currency,
  beneficiaryName,
  onContinue,
}: {
  currency: SendCurrency;
  beneficiaryName: string;
  onContinue: (quote: SendQuote) => void;
}) {
  const t = useTranslations("enviar");
  const isBrl = currency === "BRL";
  const [side, setSide] = useState<"send" | "receive">("send");
  const [amount, setAmount] = useState(10000);
  const effectiveSide = isBrl ? "send" : side;
  const { status, quote, error, refresh } = useQuote(currency, effectiveSide, amount);

  // Countdown tick (only while a non-BRL quote is live and not yet expired).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!quote?.expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [quote?.expiresAt]);

  const secs = remainingSeconds(quote?.expiresAt ?? null, now);
  const expired = secs === 0 && Boolean(quote?.expiresAt);
  const insufficient = status === "ready" && quote !== null && !quote.enoughBalance;
  const aveniaError = error instanceof ApiError ? error.message : null;
  const canContinue =
    status === "ready" && quote !== null && quote.enoughBalance && !expired && amount > 0;

  const sendFixed = effectiveSide === "send";
  const sendValue = sendFixed ? formatNum(amount) : quote ? formatNum(quote.lines.sendAmount) : "—";
  const receiveValue = !sendFixed
    ? formatNum(amount)
    : quote
      ? formatNum(quote.lines.receiveAmount)
      : "—";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Amount cards */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {!isBrl && (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[13px] font-semibold text-foreground/80">{t("amount.fixLabel")}</span>
              <div role="radiogroup" className="inline-flex gap-1 rounded-xl bg-muted p-1">
                {(["send", "receive"] as const).map((s) => {
                  const on = side === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setSide(s)}
                      className={`h-9 rounded-lg px-3.5 text-[13.5px] font-semibold ${on ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                    >
                      {t(s === "send" ? "amount.fixSend" : "amount.fixReceive")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <AmountCard
            label={t("amount.sendCard")}
            fixedBadge={sendFixed && !isBrl ? t("amount.fixedBadge") : null}
            symbol="R$"
            value={sendValue}
            readOnly={!sendFixed}
            onChange={(v) => {
              setSide("send");
              setAmount(parseDigits(v));
            }}
            currency="BRL"
            code="BRL"
            highlight={sendFixed}
          >
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[13px]">
              <span className="text-muted-foreground">
                {t("amount.balance")}:{" "}
                <span className="font-semibold tabular-nums text-foreground/80">
                  {quote ? money(quote.balanceBrl, "BRL") : "—"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!quote) return;
                  setSide("send");
                  setAmount(quote.balanceBrl);
                }}
                className="ml-auto h-8 rounded-full border border-input px-3 text-[12.5px] font-bold hover:border-foreground"
              >
                {t("amount.max")}
              </button>
            </div>
            <Divider label={t("amount.method")} value={t("amount.methodValue")} />
          </AmountCard>

          {insufficient && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-[13.5px] leading-snug text-foreground/80"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>
                {featureFlags.deposito
                  ? t.rich("amount.insufficientDeposit", {
                      dep: (chunks) => (
                        <Link href="/deposito" className="font-semibold text-primary underline">
                          {chunks}
                        </Link>
                      ),
                    })
                  : t("amount.insufficient")}
              </span>
            </div>
          )}

          <AmountCard
            label={t("amount.receiveCard", { name: beneficiaryName })}
            fixedBadge={!sendFixed ? t("amount.fixedBadge") : null}
            symbol={SYMBOL[currency]}
            value={receiveValue}
            readOnly={sendFixed}
            onChange={(v) => {
              setSide("receive");
              setAmount(parseDigits(v));
            }}
            currency={currency}
            code={currency}
            highlight={!sendFixed}
          >
            <Divider label={t("amount.rail")} value={RAIL[currency]} />
          </AmountCard>
        </div>

        {/* Estimate panel */}
        <div className="flex min-w-0 flex-1 flex-col gap-3.5 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">{t("amount.summary")}</span>
            <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-[11.5px] font-bold text-warning">
              {t("amount.estimateBadge")}
            </span>
            <span className="ml-auto rounded-full border border-dashed border-input px-2.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground">
              {t("amount.exampleBadge")}
            </span>
          </div>

          {status === "calculating" && !quote ? (
            <div aria-busy="true" className="space-y-3 py-1">
              {["w-3/5", "w-2/5", "w-5/12", "w-1/2", "w-2/3"].map((w, i) => (
                <div key={i} className="flex justify-between gap-5">
                  <Skeleton className={`h-3.5 ${w}`} />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))}
              <p className="text-[12.5px] text-muted-foreground">{t("amount.calculating")}</p>
            </div>
          ) : status === "error" ? (
            <div role="alert" className="flex flex-col items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm leading-snug text-foreground/80">{t("amount.quoteError")}</p>
              {aveniaError && (
                <p className="text-[13px] font-medium text-destructive">
                  {t("amount.aveniaInformed", { message: aveniaError })}
                </p>
              )}
              <button
                type="button"
                onClick={refresh}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-input bg-card px-4 text-[13.5px] font-semibold hover:border-foreground"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {t("amount.retry")}
              </button>
            </div>
          ) : quote ? (
            <>
              <dl className={`m-0 flex flex-col ${expired ? "opacity-50" : ""}`}>
                {quoteRows(quote, currency, t).map((row) => (
                  <div
                    key={row.key}
                    className={`flex items-baseline justify-between gap-4 ${row.total ? "border-t border-border pt-3 pb-0.5" : "py-2"}`}
                  >
                    <dt className={row.total ? "text-[15px] font-bold text-foreground" : "text-[13.5px] text-muted-foreground"}>
                      {row.label}
                    </dt>
                    <dd className={`m-0 text-right tabular-nums ${row.total ? "text-[18px] font-bold" : "text-sm"}`}>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {quote.expiresAt && (
                <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
                  <div className="flex justify-between gap-2.5 text-[13px]">
                    <span className="text-muted-foreground">{t("amount.referenceRate")}</span>
                    <span className="font-semibold tabular-nums">
                      1 {currency} = R${" "}
                      {quote.referenceRate.toLocaleString("pt-BR", {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2.5 text-[13px]">
                    <span className="text-foreground/80">
                      {t("amount.validUntil", { time: timeOf(quote.expiresAt) })}
                    </span>
                    <span
                      aria-live="polite"
                      className={`rounded-md px-2 py-0.5 font-mono text-[12.5px] font-medium ${
                        expired ? "bg-destructive/10 text-destructive" : (secs ?? 0) < 60 ? "bg-warning/10 text-warning" : "bg-muted text-foreground/80"
                      }`}
                    >
                      {formatCountdown(secs ?? 0)}
                    </span>
                  </div>
                  <div className="h-1 rounded bg-border">
                    <div
                      className={`h-full rounded ${(secs ?? 0) < 60 ? "bg-warning" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, ((secs ?? 0) / QUOTE_SECONDS) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {expired && (
                <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-3">
                  <span className="flex-1 text-[13.5px] leading-snug text-warning">{t("amount.expired")}</span>
                  <button
                    type="button"
                    onClick={refresh}
                    className="h-10 rounded-xl bg-primary px-3.5 text-[13.5px] font-semibold text-primary-foreground hover:opacity-90"
                  >
                    {t("amount.refresh")}
                  </button>
                </div>
              )}

              <p className="text-[12.5px] text-muted-foreground">{t("amount.executedByAvenia")}</p>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => quote && onContinue(quote)}
          disabled={!canContinue}
          className="inline-flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("amount.continue")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function quoteRows(
  quote: SendQuote,
  currency: SendCurrency,
  t: ReturnType<typeof useTranslations>,
): Array<{ key: string; label: string; value: string; total?: boolean }> {
  const l = quote.lines;
  const rows: Array<{ key: string; label: string; value: string; total?: boolean }> = [
    { key: "sent", label: t("amount.lineSent"), value: money(l.sendAmount, "BRL") },
  ];
  // Hide any 0-value fee/commission line (business rule).
  if (l.aveniaFee > 0) rows.push({ key: "avenia", label: t("amount.feeAvenia"), value: `− ${money(l.aveniaFee, "BRL")}` });
  if (l.railFee > 0) rows.push({ key: "rail", label: t("amount.feeRail", { rail: RAIL[currency] }), value: `− ${money(l.railFee, "BRL")}` });
  if (l.bravachainCommission > 0)
    rows.push({ key: "commission", label: t("amount.commission"), value: `− ${money(l.bravachainCommission, "BRL")}` });
  rows.push({ key: "received", label: t("amount.received"), value: money(l.receiveAmount, currency), total: true });
  return rows;
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Divider({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 flex justify-between gap-2.5 border-t border-dashed border-border pt-3 text-[13.5px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function AmountCard({
  label,
  fixedBadge,
  symbol,
  value,
  readOnly,
  onChange,
  currency,
  code,
  highlight,
  children,
}: {
  label: string;
  fixedBadge: string | null;
  symbol: string;
  value: string;
  readOnly: boolean;
  onChange: (v: string) => void;
  currency: SendCurrency;
  code: string;
  highlight: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border bg-card px-5 py-4 ${highlight ? "border-primary" : "border-border"}`}>
      <div className="flex items-center gap-2 text-[13.5px] font-semibold text-foreground/80">
        {label}
        {fixedBadge && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{fixedBadge}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2.5">
        <span className="font-serif text-2xl font-bold text-muted-foreground">{symbol}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          inputMode="numeric"
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent font-serif text-[34px] font-bold tabular-nums tracking-tight text-foreground outline-none"
        />
        <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 text-sm font-semibold">
          <CurrencyFlag currency={currency} size={22} />
          {code}
        </span>
      </div>
      {children}
    </div>
  );
}
