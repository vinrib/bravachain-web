"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPending } from "@/lib/receive/labels";
import type { ReceiveDict } from "@/lib/receive/i18n";

interface CopyFieldProps {
  label: string;
  value: unknown;
  dict: ReceiveDict;
  emphasize?: boolean;
  /** Wrap onto multiple lines instead of truncating — for long free-text values (addresses). */
  wrap?: boolean;
}

/**
 * One labelled value with a copy button. Pending values ("A confirmar") are
 * shown muted and are NOT copyable.
 */
export function CopyField({ label, value, dict, emphasize, wrap }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const pending = isPending(value);
  const text = typeof value === "string" ? value : value == null ? "" : String(value);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — leave the value visible for manual copy.
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5",
        emphasize ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/50",
      )}
    >
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {pending ? (
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            {dict.pending}
          </p>
        ) : (
          <p
            className={cn(
              "text-sm font-medium text-foreground tabular-nums",
              wrap ? "whitespace-normal break-words" : "truncate",
            )}
          >
            {text || "—"}
          </p>
        )}
      </div>
      {!pending && text && (
        <button
          type="button"
          onClick={copy}
          aria-label={dict.copy}
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {dict.copied}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {dict.copy}
            </>
          )}
        </button>
      )}
    </div>
  );
}
