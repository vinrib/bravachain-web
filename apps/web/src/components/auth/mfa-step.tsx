"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { mfaVerify, MfaVerifyFailure } from "@/lib/mfa/api";
import { formatLockWait } from "@/lib/mfa/errors";

const FIELD =
  "h-[50px] w-full rounded-[12px] border border-[#d9d5ca] bg-white px-[15px] text-[15px] text-[#011a0f] outline-none placeholder:text-[#9aa09a] focus:border-[#011a0f] focus:ring-2 focus:ring-[#0b6b4f]/40";
const LABEL = "text-[13.5px] font-semibold text-[#011a0f]";

interface MfaStepProps {
  /** Challenge token from the login response. Held in memory only. */
  mfaToken: string;
  /** Called after the second factor is verified and the session is set. */
  onSuccess: () => void;
  /** Called when the challenge expired/was consumed; parent returns to step 1. */
  onExpired: (message: string) => void;
  /** Called when the user chooses to go back to the credentials step. */
  onBack: () => void;
}

export function MfaStep({ mfaToken, onSuccess, onExpired, onBack }: MfaStepProps) {
  const t = useTranslations("mfa");
  const [mode, setMode] = useState<"code" | "recovery">("code");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear the entered secret from state when leaving the screen.
  useEffect(() => {
    return () => setValue("");
  }, []);

  // Keep focus on the active input when toggling modes.
  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const isCode = mode === "code";
  const canSubmit = isCode ? value.length === 6 : value.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);
    try {
      await mfaVerify(
        isCode
          ? { mfaToken, code: value }
          : { mfaToken, recoveryCode: value.trim() },
      );
      setValue("");
      onSuccess();
    } catch (err) {
      if (err instanceof MfaVerifyFailure) {
        const { kind, retryAfterSeconds } = err.view;
        if (kind === "expired") {
          setValue("");
          onExpired(t("errorExpired"));
          return;
        }
        if (kind === "locked") {
          const time = formatLockWait(retryAfterSeconds);
          setError(time ? t("errorLocked", { time }) : t("errorLockedNoTime"));
        } else if (kind === "invalid") {
          setError(t("errorInvalid"));
        } else {
          setError(t("errorGeneric"));
        }
      } else {
        setError(t("errorGeneric"));
      }
      setValue("");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: "code" | "recovery") {
    setMode(next);
    setValue("");
    setError(null);
  }

  return (
    <div className="relative flex w-full max-w-[380px] flex-col gap-[22px]">
      <h1 className="font-serif text-[28px] font-bold leading-[1.25] text-[#011a0f]">
        {t("title")}
      </h1>
      <p className="-mt-3 text-[14.5px] leading-[1.5] text-[#3d4640]">
        {isCode ? t("subtitle") : t("recoverySubtitle")}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mfa-value" className={LABEL}>
            {isCode ? t("codeLabel") : t("recoveryLabel")}
          </label>
          {isCode ? (
            <input
              id="mfa-value"
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder={t("codePlaceholder")}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoFocus
              className={`${FIELD} text-center font-mono text-[22px] tracking-[0.5em]`}
            />
          ) : (
            <input
              id="mfa-value"
              ref={inputRef}
              type="text"
              autoComplete="one-time-code"
              placeholder={t("recoveryPlaceholder")}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              autoFocus
              className={`${FIELD} font-mono`}
            />
          )}
        </div>

        {error && (
          <p role="alert" className="text-[13.5px] font-medium text-[#b03030]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="flex h-[52px] w-full items-center justify-center rounded-[12px] bg-[#011a0f] text-[15.5px] font-semibold text-white transition-colors hover:bg-[#0b3b2e] disabled:opacity-60"
        >
          {loading ? t("verifying") : t("verify")}
        </button>
      </form>

      <button
        type="button"
        onClick={() => switchMode(isCode ? "recovery" : "code")}
        className="min-h-[44px] text-[14px] font-semibold text-[#0b6b4f] hover:underline"
      >
        {isCode ? t("useRecovery") : t("useCode")}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="-mt-3 min-h-[44px] text-center text-[13.5px] text-[#5e6661] hover:text-[#011a0f]"
      >
        {t("backToLogin")}
      </button>
    </div>
  );
}
