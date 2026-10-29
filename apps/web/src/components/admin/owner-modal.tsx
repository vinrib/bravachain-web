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
import { ApiError } from "@/lib/client-api";
import { addOwner, updateOwner } from "@/lib/admin/compliance";
import { formatCpf, digitsOnly, isValidCpf } from "@/lib/admin/format";
import type { ClientDetail, Owner, OwnerPayload } from "@/lib/admin/types";

/** Business error codes whose friendly copy lives under `admin.review.owners.errors`. */
const KNOWN_CODES = new Set([
  "OWNERSHIP_SUM_EXCEEDED",
  "PEP_POSITION_REQUIRED",
  "RISK_FLOOR_VIOLATION",
  "REASON_REQUIRED",
]);

export interface OwnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  /** null/undefined → create; an owner → edit that owner. */
  owner?: Owner | null;
  /** When true, saving reopens the review and clears approvals — warn the user. */
  approvalsExist: boolean;
  onSaved: (detail: ClientDetail) => void;
}

export function OwnerModal({
  open,
  onOpenChange,
  userId,
  owner,
  approvalsExist,
  onSaved,
}: OwnerModalProps) {
  const t = useTranslations("admin.review.owners");
  const tm = useTranslations("admin.review.owners.modal");
  const tc = useTranslations("admin.common");
  const isEdit = !!owner;

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [ownership, setOwnership] = useState("");
  const [role, setRole] = useState("");
  const [isPep, setIsPep] = useState(false);
  const [relatedToPep, setRelatedToPep] = useState(false);
  const [pepRole, setPepRole] = useState("");
  const [pepEndedAt, setPepEndedAt] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Seed from the owner on open; the CPF field always starts blank (editing never
  // loads the current CPF — only a freshly typed value is ever sent).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) return;
    setFullName(owner?.fullName ?? "");
    setCpf("");
    setOwnership(owner?.ownershipPercent != null ? String(owner.ownershipPercent) : "");
    setRole(owner?.role ?? "");
    setIsPep(owner?.isPep ?? false);
    setRelatedToPep(owner?.relatedToPep ?? false);
    setPepRole(owner?.pepRole ?? "");
    setPepEndedAt(owner?.pepEndedAt ? owner.pepEndedAt.slice(0, 10) : "");
    setReason("");
    setBusy(false);
    setError(null);
    setShowErrors(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, owner]);

  const pepToggled = isEdit && isPep !== (owner?.isPep ?? false);
  const cpfTyped = digitsOnly(cpf).length > 0;

  const nameError = fullName.trim().length === 0 ? tm("required") : null;
  const cpfError =
    (!isEdit && !cpfTyped) || (cpfTyped && !isValidCpf(cpf))
      ? tm("cpfInvalid")
      : null;
  const pepRoleError = isPep && pepRole.trim().length === 0 ? tm("pepRoleRequired") : null;
  const reasonLen = reason.trim().length;
  const reasonError =
    pepToggled && (reasonLen < 3 || reasonLen > 500) ? tm("reasonRequired") : null;

  const valid = !nameError && !cpfError && !pepRoleError && !reasonError;

  function mapError(err: unknown): string {
    if (err instanceof ApiError && err.code && KNOWN_CODES.has(err.code)) {
      return t(`errors.${err.code}`);
    }
    return t("errors.generic");
  }

  async function submit() {
    setShowErrors(true);
    if (!valid || busy) return;
    setBusy(true);
    setError(null);

    const payload: OwnerPayload = {
      fullName: fullName.trim(),
      isPep,
      relatedToPep: isPep ? relatedToPep : false,
      role: role.trim() || null,
      pepRole: isPep ? pepRole.trim() : null,
      pepEndedAt: isPep && pepEndedAt ? pepEndedAt : null,
    };
    if (cpfTyped) payload.cpf = digitsOnly(cpf);
    const pct = Number(ownership.replace(",", "."));
    if (ownership.trim() !== "" && Number.isFinite(pct)) payload.ownershipPercent = pct;
    if (reasonLen >= 3) payload.reason = reason.trim();

    try {
      const detail =
        isEdit && owner
          ? await updateOwner(userId, owner.id, payload)
          : await addOwner(userId, payload);
      onSaved(detail);
      onOpenChange(false);
    } catch (err) {
      setError(mapError(err));
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent>
        <DialogTitle>{isEdit ? tm("editTitle") : tm("createTitle")}</DialogTitle>
        <DialogDescription>{tm("subtitle")}</DialogDescription>

        <div className="flex flex-col gap-3">
          <ModalField label={tm("fullName")} error={showErrors ? nameError : null}>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={200}
              className={inputCls}
            />
          </ModalField>

          <ModalField
            label={tm("cpf")}
            error={showErrors ? cpfError : null}
            hint={isEdit ? tm("cpfEditHint") : undefined}
          >
            <input
              inputMode="numeric"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(digitsOnly(e.target.value).slice(0, 11)))}
              placeholder="000.000.000-00"
              className={inputCls}
            />
          </ModalField>

          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label={tm("ownership")}>
              <input
                inputMode="decimal"
                value={ownership}
                onChange={(e) => setOwnership(e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="0"
                className={inputCls}
              />
            </ModalField>
            <ModalField label={tm("role")}>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                maxLength={100}
                className={inputCls}
              />
            </ModalField>
          </div>

          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isPep}
              onChange={(e) => setIsPep(e.target.checked)}
              className="h-5 w-5 accent-[#0b6b4f]"
            />
            {tm("isPep")}
          </label>

          {isPep && (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={relatedToPep}
                  onChange={(e) => setRelatedToPep(e.target.checked)}
                  className="h-5 w-5 accent-[#0b6b4f]"
                />
                {tm("relatedToPep")}
              </label>
              <ModalField label={tm("pepRole")} error={showErrors ? pepRoleError : null}>
                <input
                  value={pepRole}
                  onChange={(e) => setPepRole(e.target.value)}
                  maxLength={200}
                  className={inputCls}
                />
              </ModalField>
              <ModalField label={tm("pepEndedAt")}>
                <input
                  type="date"
                  value={pepEndedAt}
                  onChange={(e) => setPepEndedAt(e.target.value)}
                  className={inputCls}
                />
              </ModalField>
            </div>
          )}

          {pepToggled && (
            <ModalField label={tm("reason")} error={showErrors ? reasonError : null} hint={tm("reasonPepHint")}>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full resize-none rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </ModalField>
          )}
        </div>

        {approvalsExist && (
          <div
            role="note"
            className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("reopenWarning")}</span>
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
            {tc("cancel")}
          </Button>
          <Button type="button" size="md" onClick={submit} disabled={busy}>
            {busy ? tc("saving") : tm("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function ModalField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13.5px] font-semibold text-foreground">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && (
        <span role="alert" className="text-xs font-medium text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
