"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Copy, Check, Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { mfaEnrollStart, mfaEnrollConfirm } from "@/lib/mfa/api";
import { formatSecretForDisplay, type EnrollStart } from "@/lib/mfa/enroll";
import { ADMIN_HOME } from "@/lib/mfa/routes";

type Step = 1 | 2 | 3;
const TOTAL_STEPS = 3;

export function MfaEnrollmentWizard({ required = false }: { required?: boolean }) {
  const t = useTranslations("admin.enroll");
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [start, setStart] = useState<EnrollStart | null>(null);
  const [startError, setStartError] = useState(false);
  const [starting, setStarting] = useState(true);

  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(false);

  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const beginEnrollment = useCallback(async () => {
    setStarting(true);
    setStartError(false);
    try {
      setStart(await mfaEnrollStart());
    } catch {
      setStartError(true);
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    // Kick off enrollment on mount; the synchronous loading flag it sets is
    // intentional (same pattern as the data hooks).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void beginEnrollment();
  }, [beginEnrollment]);

  // Scrub all sensitive material from state when leaving the screen.
  useEffect(() => {
    return () => {
      setStart(null);
      setCode("");
      setRecoveryCodes([]);
    };
  }, []);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6 || confirming) return;
    setConfirming(true);
    setConfirmError(false);
    try {
      const { recoveryCodes: codes } = await mfaEnrollConfirm(code);
      setCode("");
      setRecoveryCodes(codes);
      setStep(3);
    } catch {
      setConfirmError(true);
      setCode("");
    } finally {
      setConfirming(false);
    }
  }

  async function copy(text: string, mark: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      mark(true);
      setTimeout(() => mark(false), 2000);
    } catch {
      /* clipboard denied — the value stays visible for manual copy */
    }
  }

  function downloadCodes() {
    const blob = new Blob([`${recoveryCodes.join("\n")}\n`], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bravachain-codigos-recuperacao.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function finish() {
    setRecoveryCodes([]);
    setSaved(false);
    router.replace(ADMIN_HOME);
    router.refresh();
  }

  const displaySecret = formatSecretForDisplay(start?.secret ?? null);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("stepOf", { current: step, total: TOTAL_STEPS })}
        </p>
        <h1 className="mt-1 font-serif text-[28px] font-bold text-foreground">
          {t("title")}
        </h1>
      </div>

      {required && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{t("required")}</span>
        </div>
      )}

      {/* Step 1 — install + scan */}
      {step === 1 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-foreground">
            {t("step1.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("step1.body")}</p>

          {starting && (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Spinner /> {t("loading")}
            </div>
          )}

          {!starting && startError && (
            <div className="py-6">
              <p className="text-sm text-destructive">{t("errorStart")}</p>
              <Button
                variant="secondary"
                size="md"
                className="mt-3"
                onClick={() => void beginEnrollment()}
              >
                {t("step1.continue")}
              </Button>
            </div>
          )}

          {!starting && !startError && start && (
            <>
              <div className="mt-5 flex flex-col items-center gap-4">
                {start.qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={start.qrDataUrl}
                    alt={t("step1.qrAlt")}
                    width={192}
                    height={192}
                    className="h-48 w-48 rounded-xl border border-border bg-white p-2"
                  />
                ) : null}

                {displaySecret && (
                  <div className="w-full">
                    <p className="text-[13.5px] font-semibold text-foreground">
                      {t("step1.secretLabel")}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <code className="flex-1 break-all rounded-xl border border-border bg-muted px-3 py-2.5 font-mono text-sm text-foreground">
                        {displaySecret}
                      </code>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        aria-label={t("step1.copyKey")}
                        onClick={() => start.secret && copy(start.secret, setCopiedKey)}
                      >
                        {copiedKey ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="mt-6 w-full"
                onClick={() => setStep(2)}
              >
                {t("step1.continue")}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Step 2 — confirm first code */}
      {step === 2 && (
        <form
          onSubmit={handleConfirm}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          noValidate
        >
          <h2 className="font-serif text-xl font-bold text-foreground">
            {t("step2.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("step2.body")}</p>

          <label
            htmlFor="mfa-enroll-code"
            className="mt-5 block text-[13.5px] font-semibold text-foreground"
          >
            {t("step2.codeLabel")}
          </label>
          <input
            id="mfa-enroll-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            autoFocus
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1.5 h-[52px] w-full rounded-xl border border-border bg-input text-center font-mono text-[22px] tracking-[0.5em] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          {confirmError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {t("errorConfirm")}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="sm:flex-1"
              onClick={() => {
                setCode("");
                setConfirmError(false);
                setStep(1);
              }}
            >
              {t("step2.back")}
            </Button>
            <Button
              type="submit"
              size="lg"
              className="sm:flex-1"
              disabled={code.length !== 6 || confirming}
            >
              {confirming ? t("step2.confirming") : t("step2.confirm")}
            </Button>
          </div>
        </form>
      )}

      {/* Step 3 — save recovery codes */}
      {step === 3 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-foreground">
            {t("step3.title")}
          </h2>

          <div
            role="alert"
            className="mt-3 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
          >
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{t("step3.warning")}</span>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-2">
            {recoveryCodes.map((rc, i) => (
              <li
                key={i}
                className="rounded-lg border border-border bg-muted px-3 py-2 text-center font-mono text-sm text-foreground"
              >
                {rc}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => copy(recoveryCodes.join("\n"), setCopiedCodes)}
            >
              {copiedCodes ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedCodes ? t("step3.copied") : t("step3.copy")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={downloadCodes}
            >
              <Download className="h-4 w-4" />
              {t("step3.download")}
            </Button>
          </div>

          <div className="mt-5">
            <Checkbox
              id="mfa-saved"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              label={t("step3.savedLabel")}
            />
          </div>

          <Button size="lg" className="mt-6 w-full" disabled={!saved} onClick={finish}>
            {t("step3.finish")}
          </Button>
        </div>
      )}
    </div>
  );
}
