"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const REASON_MIN = 3;
const REASON_MAX = 500;

export interface ReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Audit disclosure line shown in a note box. */
  auditNote?: string;
  /** When true (default) the reason is mandatory (3–500 chars). */
  requireReason?: boolean;
  reasonLabel: string;
  reasonPlaceholder?: string;
  confirmLabel: string;
  destructive?: boolean;
  /** Extra gating from the parent (e.g. a user must be selected). */
  confirmDisabled?: boolean;
  /** Content rendered above the reason field (e.g. a user search). */
  children?: React.ReactNode;
  /** Runs the mutation; resolve closes the modal, reject shows its message. */
  onConfirm: (reason: string) => Promise<void>;
}

export function ReasonModal({
  open,
  onOpenChange,
  title,
  description,
  auditNote,
  requireReason = true,
  reasonLabel,
  reasonPlaceholder,
  confirmLabel,
  destructive = false,
  confirmDisabled = false,
  children,
  onConfirm,
}: ReasonModalProps) {
  const t = useTranslations("admin.common");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset transient state whenever the modal (re)opens.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      setReason("");
      setBusy(false);
      setError(null);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  const reasonLen = reason.trim().length;
  const reasonValid = !requireReason || (reasonLen >= REASON_MIN && reasonLen <= REASON_MAX);
  const canConfirm = reasonValid && !confirmDisabled && !busy;

  async function handleConfirm() {
    if (!canConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
    } catch {
      setError(t("actionError"));
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}

        {children}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason-field" className="text-[13.5px] font-semibold text-foreground">
            {reasonLabel}
            {!requireReason && (
              <span className="ml-1 font-normal text-muted-foreground">{t("optional")}</span>
            )}
          </label>
          <textarea
            id="reason-field"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={REASON_MAX}
            rows={3}
            placeholder={reasonPlaceholder}
            className="w-full resize-none rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {requireReason && (
            <span className="text-xs text-muted-foreground">
              {t("reasonHint", { min: REASON_MIN, max: REASON_MAX })}
            </span>
          )}
        </div>

        {auditNote && (
          <div
            role="note"
            className="flex items-start gap-2.5 rounded-xl border border-border bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{auditNote}</span>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "primary"}
            size="md"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {busy ? t("saving") : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
