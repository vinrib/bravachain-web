"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { formatMoney } from "@bravachain/shared";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { CurrencyFlag } from "@/components/ui/flags";
import { useMe } from "@/lib/hooks";
import { createSend } from "@/lib/send/api";
import { remainingSeconds, formatCountdown } from "@/lib/deposit/status";
import type {
  BeneficiarySummary,
  SendCurrency,
  SendDetails,
  SendQuote,
  SendResult,
} from "@/lib/send/types";

const RAIL: Record<SendCurrency, string> = { BRL: "Pix", USD: "Wire", EUR: "SEPA" };
const money = (n: number, currency: SendCurrency): string => formatMoney(n, { currency });

interface Row {
  label: string;
  value: string;
  total?: boolean;
  mono?: boolean;
}

/**
 * Step 4: review and confirm. Confirming sends with an Idempotency-Key (UUID v4)
 * generated on first click and reused on retry, and the button is disabled while
 * in flight — so a double-click never creates two sends. Settlement is Avenia's.
 */
export function ReviewStep({
  currency,
  beneficiary,
  quote,
  details,
  onConfirmed,
}: {
  currency: SendCurrency;
  beneficiary: BeneficiarySummary;
  quote: SendQuote;
  details: SendDetails;
  onConfirmed: (send: SendResult) => void;
}) {
  const t = useTranslations("enviar");
  const me = useMe();
  const isBrl = currency === "BRL";
  const [sending, setSending] = useState(false);
  // Synchronous guard: blocks a second click before React re-renders the
  // disabled button (state lags a rapid double-click).
  const sendingRef = useRef(false);
  // One Idempotency-Key per (quote, beneficiary); reused across retries.
  const idemRef = useRef<{ sig: string; key: string } | null>(null);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!quote.expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [quote.expiresAt]);
  const secs = remainingSeconds(quote.expiresAt, now);
  const expired = secs === 0 && Boolean(quote.expiresAt);

  function keyFor(sig: string): string {
    if (idemRef.current?.sig === sig) return idemRef.current.key;
    const key = crypto.randomUUID();
    idemRef.current = { sig, key };
    return key;
  }

  async function confirm() {
    if (sendingRef.current || expired) return;
    sendingRef.current = true;
    const sig = `${quote.quoteId}|${beneficiary.id}`;
    setSending(true);
    try {
      const result = await createSend(
        {
          quoteId: quote.quoteId,
          beneficiaryId: beneficiary.id,
          message: details.message,
          purposeCode: details.purposeCode,
        },
        keyFor(sig),
      );
      onConfirmed(result);
    } catch {
      // Keep the same key so a retry de-duplicates; re-enable the button.
      sendingRef.current = false;
      setSending(false);
    }
  }

  const l = quote.lines;
  const rows: Row[] = [{ label: t("amount.lineSent"), value: money(l.sendAmount, "BRL") }];
  if (l.aveniaFee > 0) rows.push({ label: t("amount.feeAvenia"), value: `− ${money(l.aveniaFee, "BRL")}` });
  if (l.railFee > 0) rows.push({ label: t("amount.feeRail", { rail: RAIL[currency] }), value: `− ${money(l.railFee, "BRL")}` });
  if (l.bravachainCommission > 0)
    rows.push({ label: t("amount.commission"), value: `− ${money(l.bravachainCommission, "BRL")}` });
  rows.push({ label: t("amount.received"), value: money(l.receiveAmount, currency), total: true });
  if (!isBrl)
    rows.push({
      label: t("amount.referenceRate"),
      value: `R$ ${quote.referenceRate.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
    });
  rows.push({
    label: isBrl ? t("details.messageLabelPix") : t("details.messageLabel"),
    value: details.message || t("review.emptyValue"),
  });
  if (!isBrl)
    rows.push({
      label: t("review.purposeRowLabel"),
      value: details.purposeCode ? `${details.purposeCode} — ${details.purposeName ?? ""}` : t("review.emptyValue"),
      mono: false,
    });

  return (
    <div className="space-y-5">
      {!isBrl && quote.expiresAt && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-[11.5px] font-bold text-warning">
            {t("amount.estimateBadge")}
          </span>
          <span className="text-[13.5px] text-foreground/80">
            {t("amount.validUntil", { time: new Date(quote.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) })}
          </span>
          <span
            aria-live="polite"
            className={`ml-auto rounded-md px-2 py-0.5 font-mono text-[12.5px] ${expired ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground/80"}`}
          >
            {formatCountdown(secs ?? 0)}
          </span>
        </div>
      )}

      <div className="flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-7">
        {/* De → Para */}
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="flex min-w-[180px] flex-1 flex-col gap-0.5">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground">{t("review.from")}</span>
            <span className="text-[15px] font-semibold">{t("review.accountBalance")} · BRL</span>
            {me.data?.name && <span className="text-[12.5px] text-muted-foreground">{me.data.name}</span>}
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="flex min-w-[180px] flex-1 items-center gap-2.5">
            <CurrencyFlag currency={currency} size={34} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground">
                {t("review.to")} · {currency}
              </span>
              <span className="truncate text-[15px] font-semibold">{beneficiary.name}</span>
              <span className="truncate text-[12.5px] text-muted-foreground">{beneficiary.line}</span>
            </div>
          </div>
        </div>

        <dl className="m-0 flex flex-col border-t border-border">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-baseline justify-between gap-4 py-2.5 ${i ? "border-t border-border/60" : ""}`}
            >
              <dt className={row.total ? "text-[15px] font-bold text-foreground" : "text-[13.5px] text-muted-foreground"}>
                {row.label}
              </dt>
              <dd className={`m-0 text-right tabular-nums ${row.total ? "text-[17px] font-bold" : "text-sm"} ${row.mono ? "font-mono" : ""}`}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3.5 text-[12.5px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t("review.settledByAvenia")}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={confirm}
          disabled={sending || expired}
          aria-busy={sending}
          className="inline-flex h-12 min-w-[180px] items-center justify-center gap-2.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? (
            <>
              <Spinner size="sm" />
              {t("review.confirming")}
            </>
          ) : (
            t("review.confirm")
          )}
        </button>
      </div>
    </div>
  );
}
