"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, FileText, Upload } from "lucide-react";
import { getPurposeCodes } from "@/lib/send/api";
import type { PurposeCategory, SendCurrency, SendDetails, SendQuote } from "@/lib/send/types";
import { PurposePicker } from "./purpose-picker";

const MESSAGE_MAX = 140;
const MAX_INVOICE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];

/**
 * Step 3: deposit message, purpose (required for USD/EUR) and a conditional
 * invoice upload (only when the quote says invoiceRequired). Only the purpose
 * blocks "Continuar"; refusals/limits are Avenia's, surfaced elsewhere.
 */
export function DetailsStep({
  currency,
  quote,
  onContinue,
}: {
  currency: SendCurrency;
  quote: SendQuote;
  onContinue: (details: SendDetails) => void;
}) {
  const t = useTranslations("enviar");
  const isBrl = currency === "BRL";
  const [message, setMessage] = useState("");
  const [purposeCode, setPurposeCode] = useState<string | null>(null);
  const [finError, setFinError] = useState(false);
  const [categories, setCategories] = useState<PurposeCategory[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isBrl) return;
    let active = true;
    getPurposeCodes()
      .then((c) => active && setCategories(c))
      .catch(() => active && setCategories([]));
    return () => {
      active = false;
    };
  }, [isBrl]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type) || file.size > MAX_INVOICE_BYTES) {
      setFileError(true);
      setFileName(null);
      return;
    }
    setFileError(false);
    setFileName(file.name);
  }

  function handleContinue() {
    if (!isBrl && !purposeCode) {
      setFinError(true);
      return;
    }
    const purposeName =
      categories.flatMap((c) => c.items).find((i) => i.code === purposeCode)?.name ?? null;
    onContinue({
      message: message.trim(),
      purposeCode,
      purposeName,
      invoiceAttached: Boolean(fileName),
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-7">
        {/* Deposit message */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-1.5">
            <label htmlFor="send-message" className="text-[13.5px] font-semibold text-foreground/80">
              {isBrl ? t("details.messageLabelPix") : t("details.messageLabel")}
            </label>
            <span className="text-[12.5px] text-muted-foreground">{t("details.optional")}</span>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {message.length}/{MESSAGE_MAX}
            </span>
          </div>
          <input
            id="send-message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
            maxLength={MESSAGE_MAX}
            placeholder={t("details.messagePlaceholder")}
            aria-describedby="send-message-hint"
            className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm font-medium outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <p id="send-message-hint" className="text-[12.5px] text-muted-foreground">
            {quote.messageApplied ? t("details.messageHint") : t("details.messageNotApplied")}
          </p>
        </div>

        {/* Purpose (USD/EUR only) */}
        {!isBrl && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold text-foreground/80">{t("details.purposeLabel")}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground/80">
                {t("details.purposeRequired")}
              </span>
            </div>
            <PurposePicker
              categories={categories}
              value={purposeCode}
              onChange={(code) => {
                setPurposeCode(code);
                setFinError(false);
              }}
              invalid={finError}
            />
            {finError && (
              <p className="text-[12.5px] font-medium text-destructive">{t("details.purposeError")}</p>
            )}
          </div>
        )}

        {/* Conditional invoice */}
        {quote.invoiceRequired && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] font-semibold text-foreground/80">{t("details.invoiceLabel")}</span>
              <span className="rounded-full border border-dashed border-input px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {t("details.invoiceBadge")}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={handleFile}
              className="hidden"
            />
            {fileName ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{fileName}</div>
                  <div className="text-xs text-muted-foreground">{t("details.invoiceAttached")}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFileName(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="h-9 rounded-lg px-3 text-[13px] font-semibold text-foreground/80 hover:bg-muted"
                >
                  {t("details.invoiceRemove")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`flex flex-col items-center gap-1.5 rounded-xl border border-dashed bg-muted/40 p-6 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                  fileError ? "border-destructive" : "border-input"
                }`}
              >
                <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold">{t("details.invoiceDrop")}</span>
                <span className="text-[12.5px] text-muted-foreground">{t("details.invoiceFormats")}</span>
              </button>
            )}
            {fileError && (
              <p role="alert" className="flex items-center gap-1.5 text-[12.5px] font-medium text-destructive">
                <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                {t("details.invoiceError")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleContinue}
          className="inline-flex h-12 min-w-[150px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {t("details.continue")}
        </button>
      </div>
    </div>
  );
}
