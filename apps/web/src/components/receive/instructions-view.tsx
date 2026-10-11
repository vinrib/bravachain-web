"use client";

import { AlertTriangle, Download, Info } from "lucide-react";
import { CopyField } from "./copy-field";
import { bankFieldOrder, isPending } from "@/lib/receive/labels";
import type { ReceiveDict } from "@/lib/receive/i18n";
import type { Instructions } from "@/lib/receive/types";

interface InstructionsViewProps {
  data: Instructions;
  dict: ReceiveDict;
  /** When set (and not locked), shows a "Download PDF" link. */
  pdfHref?: string;
}

/**
 * Renders formatted bank-transfer instructions. Shared by the authenticated
 * detail screen and the public pay page. While the backend warning is present
 * (Avenia not confirmed), sharing/PDF is blocked and pending fields aren't
 * copyable (handled by CopyField).
 */
export function InstructionsView({ data, dict, pdfHref }: InstructionsViewProps) {
  const fields = bankFieldOrder(data.bankDetails);
  const memo = fields.find((f) => f.key === "wireMemo");
  const rest = fields.filter((f) => f.key !== "wireMemo");
  const anyPending = fields.some((f) => isPending(f.value));
  const locked = Boolean(data.warning) || anyPending;

  return (
    <div className="space-y-5">
      {/* Amount */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{dict.amount}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
          {String(data.amount)} {data.currency}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{data.methodLabel}</p>
      </div>

      {/* Backend warning (Avenia not confirmed) */}
      {data.warning && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {dict.warningTitle}
            </p>
            <p className="text-sm text-amber-700/90 dark:text-amber-400/90">
              {data.warning}
            </p>
          </div>
        </div>
      )}

      {/* Pending bank details note (when no explicit warning but fields pending) */}
      {!data.warning && anyPending && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {dict.pendingTitle}
            </p>
            <p className="text-sm text-amber-700/90 dark:text-amber-400/90">
              {dict.pendingHint}
            </p>
          </div>
        </div>
      )}

      {/* Bank details */}
      <div className="space-y-2">
        {rest.map((f) => (
          <CopyField
            key={f.key}
            label={dict.fields[f.key] ?? f.key}
            value={f.value}
            dict={dict}
          />
        ))}
      </div>

      {/* wireMemo — emphasized, required for the payer */}
      {memo && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="mb-1.5 text-sm font-semibold text-foreground">
            {dict.memoTitle}
          </p>
          <CopyField
            label={dict.fields.wireMemo ?? "Memo"}
            value={memo.value}
            dict={dict}
            emphasize
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{dict.memoHint}</p>
        </div>
      )}

      {/* How-to-pay steps */}
      {data.instructions?.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-foreground">
            {dict.howToPay}
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {data.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {data.settlementTime && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            {dict.settlement}: {data.settlementTime}
          </span>
        </div>
      )}

      {/* PDF — blocked while instructions are incomplete */}
      {pdfHref && !locked && (
        <a
          href={pdfHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          {dict.downloadPdf}
        </a>
      )}
    </div>
  );
}
