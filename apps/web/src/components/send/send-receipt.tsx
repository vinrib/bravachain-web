"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { formatMoney } from "@bravachain/shared";
import { ArrowLeft, ArrowRight, Download, ShieldCheck } from "lucide-react";
import { CurrencyFlag } from "@/components/ui/flags";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/lib/hooks";
import { getSendReceipt } from "@/lib/send/api";
import type { SendCurrency, SendReceipt as SendReceiptData } from "@/lib/send/types";
import { sendStatusBadge } from "./sends-view";

const RAIL: Record<SendCurrency, string> = { BRL: "Pix", USD: "Wire", EUR: "SEPA" };
const money = (n: number, currency: SendCurrency) => formatMoney(n, { currency });

/** Send receipt (screen + print). Informational — no claim of legal validity. */
export function SendReceipt({ id, onBack }: { id: string; onBack: () => void }) {
  const t = useTranslations("enviar");
  const me = useMe();
  const [receipt, setReceipt] = useState<SendReceiptData | null>(null);

  useEffect(() => {
    let active = true;
    getSendReceipt(id).then((r) => active && setReceipt(r));
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-foreground print:hidden"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("flow.back")}
      </button>

      {!receipt ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <ReceiptCard receipt={receipt} companyName={me.data?.name ?? null} t={t} />
      )}

      {receipt && (
        <div className="flex justify-end print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t("status.downloadReceipt")}
          </button>
        </div>
      )}
    </div>
  );
}

function ReceiptCard({
  receipt,
  companyName,
  t,
}: {
  receipt: SendReceiptData;
  companyName: string | null;
  t: ReturnType<typeof useTranslations>;
}) {
  const { currency, lines: l } = receipt;
  const isBrl = currency === "BRL";
  const badge = sendStatusBadge(receipt.status, t);

  const rows: Array<{ label: string; value: string; mono?: boolean; total?: boolean }> = [
    { label: t("receipt.identifier"), value: receipt.identifier, mono: true },
    { label: t("receipt.date"), value: receipt.createdAt },
    { label: t("amount.lineSent"), value: money(l.sendAmount, "BRL") },
  ];
  if (l.aveniaFee > 0) rows.push({ label: t("amount.feeAvenia"), value: `− ${money(l.aveniaFee, "BRL")}` });
  if (l.railFee > 0) rows.push({ label: t("amount.feeRail", { rail: RAIL[currency] }), value: `− ${money(l.railFee, "BRL")}` });
  if (l.bravachainCommission > 0)
    rows.push({ label: t("amount.commission"), value: `− ${money(l.bravachainCommission, "BRL")}` });
  rows.push({ label: t("amount.received"), value: money(l.receiveAmount, currency), total: true });
  if (!isBrl) rows.push({ label: t("details.messageLabel"), value: receipt.message || t("review.emptyValue") });
  if (!isBrl)
    rows.push({
      label: t("review.purposeRowLabel"),
      value: receipt.purposeCode ? `${receipt.purposeCode} — ${receipt.purposeName ?? ""}` : t("review.emptyValue"),
    });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 print:border-0 print:shadow-none">
      <div className="flex flex-wrap items-center gap-3 pb-4">
        <div className="flex-1">
          <div className="font-serif text-xl font-bold">Bravachain</div>
          <div className="text-[12.5px] text-muted-foreground">{t("review.settledByAvenia")}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-bold ${badge.className}`}>{badge.label}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border py-4">
        <div className="flex min-w-[170px] flex-1 flex-col gap-0.5">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">{t("review.from")}</span>
          <span className="text-[15px] font-semibold">{t("review.accountBalance")} · BRL</span>
          {companyName && <span className="text-[12.5px] text-muted-foreground">{companyName}</span>}
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="flex min-w-[170px] flex-1 items-center gap-2.5">
          <CurrencyFlag currency={currency} size={34} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground">
              {t("review.to")} · {currency}
            </span>
            <span className="truncate text-[15px] font-semibold">{receipt.beneficiaryName}</span>
            <span className="truncate text-[12.5px] text-muted-foreground">{receipt.beneficiaryLine}</span>
          </div>
        </div>
      </div>

      <dl className="m-0 flex flex-col border-t border-border">
        {rows.map((row, i) => (
          <div key={row.label} className={`flex items-baseline justify-between gap-4 py-2.5 ${i ? "border-t border-border/60" : ""}`}>
            <dt className={row.total ? "text-[15px] font-bold" : "text-[13.5px] text-muted-foreground"}>{row.label}</dt>
            <dd className={`m-0 text-right tabular-nums ${row.total ? "text-[17px] font-bold" : "text-sm"} ${row.mono ? "font-mono" : ""}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3.5 text-[12.5px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {t("amount.executedByAvenia")}
      </div>
      <p className="mt-1.5 text-[11.5px] text-muted-foreground">{t("receipt.disclaimer")}</p>
    </div>
  );
}
