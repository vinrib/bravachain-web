"use client";

import { useState } from "react";
import { Check, Download, Mail } from "lucide-react";
import { formatMoney, formatDateTime, isValidEmail } from "@bravachain/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { receiptPdfUrl, sendReceiptEmail } from "@/lib/receipts/api";
import type { ReceiptListItem } from "@/lib/receipts/types";

export function ReceiptRow({ receipt }: { receipt: ReceiptListItem }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    if (!isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setSending(true);
    try {
      const res = await sendReceiptEmail(receipt.id, email);
      setSentTo(res.recipientEmail || email);
      setEmailOpen(false);
      setEmail("");
    } catch {
      // Email sending is allowlist-restricted today — keep the message friendly.
      setError(
        "Não foi possível enviar o comprovante por e-mail agora. Tente novamente mais tarde.",
      );
    } finally {
      setSending(false);
    }
  }

  const meta = [
    `Protocolo ${receipt.protocol}`,
    receipt.bankName,
    formatDateTime(receipt.pixSentAt || receipt.createdAt),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground tabular-nums">
            {formatMoney(receipt.amountBrl)}
          </p>
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
          <p className="truncate text-xs text-muted-foreground">PIX: {receipt.pixKey}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button asChild size="sm" variant="ghost" className="gap-1.5">
            <a href={receiptPdfUrl(receipt.id)} download>
              <Download className="h-3.5 w-3.5" />
              PDF
            </a>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={() => {
              setEmailOpen((o) => !o);
              setError(null);
            }}
          >
            <Mail className="h-3.5 w-3.5" />
            E-mail
          </Button>
        </div>
      </div>

      {sentTo && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
          <Check className="h-3.5 w-3.5" />
          Comprovante enviado para {sentTo}.
        </p>
      )}

      {emailOpen && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <Input
              label="Enviar comprovante para"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="email@empresa.com"
              autoComplete="email"
            />
          </div>
          <Button type="button" size="md" onClick={send} disabled={sending}>
            {sending ? <Spinner size="sm" /> : "Enviar"}
          </Button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
