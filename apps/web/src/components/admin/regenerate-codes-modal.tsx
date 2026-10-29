"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, Download, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mfaRegenerateRecoveryCodes } from "@/lib/mfa/api";

/**
 * Regenerate my recovery codes: step 1 asks for a current TOTP code, step 2
 * shows the new codes ONCE (copy/download). Codes live only in memory and are
 * scrubbed when the modal closes; nothing is logged.
 */
export function RegenerateCodesModal({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fires after a successful regeneration (recovery-code count reset to full). */
  onDone?: () => void;
}) {
  const t = useTranslations("admin.security.regen");
  const tc = useTranslations("admin.common");

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      setCode("");
      setBusy(false);
      setError(false);
      setCodes(null);
      setCopied(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError(false);
    try {
      const { recoveryCodes } = await mfaRegenerateRecoveryCodes(code);
      setCode("");
      setCodes(recoveryCodes);
      onDone?.();
    } catch {
      setError(true);
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!codes) return;
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied — codes stay visible */
    }
  }

  function download() {
    if (!codes) return;
    const blob = new Blob([`${codes.join("\n")}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bravachain-codigos-recuperacao.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent>
        <DialogTitle>{t("title")}</DialogTitle>

        {codes === null ? (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <DialogDescription>{t("body")}</DialogDescription>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="regen-code" className="text-[13.5px] font-semibold text-foreground">
                {t("codeLabel")}
              </label>
              <input
                id="regen-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                autoFocus
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-[52px] w-full rounded-xl border border-border bg-input text-center font-mono text-[22px] tracking-[0.5em] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {t("error")}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" size="md" onClick={() => onOpenChange(false)} disabled={busy}>
                {tc("cancel")}
              </Button>
              <Button type="submit" size="md" disabled={code.length !== 6 || busy}>
                {busy ? tc("saving") : t("generate")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div
              role="note"
              className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
            >
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              {t("warning")}
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {codes.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border bg-muted px-3 py-2 text-center font-mono text-sm text-foreground"
                >
                  {c}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="md" className="flex-1" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? t("copied") : t("copy")}
              </Button>
              <Button type="button" variant="secondary" size="md" className="flex-1" onClick={download}>
                <Download className="h-4 w-4" />
                {t("download")}
              </Button>
            </div>
            <Button type="button" size="md" onClick={() => onOpenChange(false)}>
              {t("done")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
