"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { Check, Clock, Copy, Home, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/amount-input";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createPixQrCode } from "@/lib/deposit/api";
import { mapCreateError } from "@/lib/deposit/errors";
import { usePixStatus } from "@/lib/deposit/use-pix-status";
import {
  remainingSeconds,
  formatCountdown,
} from "@/lib/deposit/status";
import { formatBrlDecimal } from "@/lib/deposit/money";
import type { PixQrCode } from "@/lib/deposit/types";

const DEFAULT_DESC = "Depósito Bravachain";

function parseAmount(input: string): number | null {
  const cleaned = input.trim().replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function DepositFlow() {
  const [qr, setQr] = useState<PixQrCode | null>(null);
  if (qr) return <PixGenerated qr={qr} onReset={() => setQr(null)} />;
  return <DepositForm onGenerated={setQr} />;
}

function DepositForm({ onGenerated }: { onGenerated: (qr: PixQrCode) => void }) {
  const [amountInput, setAmountInput] = useState("");
  const [descricao, setDescricao] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  // Idempotency-Key: one per attempt (same body → same key on re-click).
  const idemRef = useRef<{ sig: string; key: string } | null>(null);

  function keyFor(sig: string): string {
    if (idemRef.current?.sig === sig) return idemRef.current.key;
    const key = crypto.randomUUID();
    idemRef.current = { sig, key };
    return key;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valor = parseAmount(amountInput);
    if (valor === null) {
      setErrors({ amount: "Informe um valor válido." });
      return;
    }
    setErrors({});
    const desc = descricao.trim() || DEFAULT_DESC;
    const sig = `${valor}|${desc}`;
    setSubmitting(true);
    try {
      const qr = await createPixQrCode({ valor, descricao: desc }, keyFor(sig));
      onGenerated(qr);
    } catch (err) {
      setErrors({ form: mapCreateError(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="text-[13.5px] font-semibold text-foreground">Valor do depósito</label>
            <AmountInput
              value={amountInput}
              onChange={(v) => {
                setAmountInput(v);
                setErrors((p) => ({ ...p, amount: undefined }));
              }}
              error={errors.amount}
              className="mt-1.5"
            />
          </div>

          <Input
            label="Descrição (opcional)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={DEFAULT_DESC}
          />

          {errors.form && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{errors.form}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : "Gerar PIX"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PixGenerated({ qr, onReset }: { qr: PixQrCode; onReset: () => void }) {
  const t = useTranslations("depositPix");
  const [secs, setSecs] = useState<number | null>(() => remainingSeconds(qr.expiresAt));
  const [copied, setCopied] = useState(false);
  // Client-side expiry: only when there's a valid expiresAt that has passed.
  const expired = secs !== null && secs <= 0;
  const { ui, notFound, data } = usePixStatus(qr.txid, qr.status, expired);

  // NEW optional estimate (before payment): shown only when BOTH fields come.
  const estFee = formatBrlDecimal(qr.estimatedFee);
  const estNet = formatBrlDecimal(qr.estimatedNetAmount);
  const estimateLine =
    estFee && estNet
      ? `${t("estimate.fee")}: ${estFee} · ${t("estimate.youReceive")}: ${estNet}`
      : null;

  // NEW optional settlement breakdown (on confirmation): only present parts.
  const paidFmt = formatBrlDecimal(data?.requestedAmount);
  const feeFmt = formatBrlDecimal(data?.feeBrl);
  const creditedFmt = formatBrlDecimal(data?.creditedAmount);
  const settledLine = [
    paidFmt && `${t("settled.paid")} ${paidFmt}`,
    feeFmt && `${t("settled.fee")} ${feeFmt}`,
    creditedFmt && `${t("settled.credited")} ${creditedFmt}`,
  ]
    .filter((p): p is string => Boolean(p))
    .join(" · ");

  // Countdown tick (only when there is an expiresAt and it hasn't passed).
  useEffect(() => {
    if (secs === null || expired) return;
    const id = setInterval(() => setSecs(remainingSeconds(qr.expiresAt)), 1000);
    return () => clearInterval(id);
  }, [qr.expiresAt, secs, expired]);

  async function copy() {
    if (!qr.pixCopiaECola) return;
    try {
      await navigator.clipboard.writeText(qr.pixCopiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* leave the code visible for manual copy */
    }
  }

  // Terminal states.
  if (ui === "paid") {
    return (
      <Result
        tone="success"
        title="Pagamento confirmado!"
        body="O saldo já está disponível na sua conta."
      >
        {settledLine && (
          <p className="text-sm font-medium tabular-nums text-foreground">{settledLine}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild><Link href="/extrato"><Receipt className="h-4 w-4" />Ver extrato</Link></Button>
          <Button asChild variant="secondary"><Link href="/"><Home className="h-4 w-4" />Ir para o início</Link></Button>
        </div>
      </Result>
    );
  }
  if (ui === "failed") {
    return (
      <Result tone="error" title="Pagamento não concluído" body="O PIX não foi confirmado.">
        <Button onClick={onReset}>Gerar novo PIX</Button>
      </Result>
    );
  }
  if (notFound) {
    return (
      <Result tone="error" title="Depósito não encontrado" body="Não localizamos este depósito.">
        <Button onClick={onReset}>Gerar novo PIX</Button>
      </Result>
    );
  }
  if (expired) {
    return (
      <Result tone="neutral" title="PIX expirado" body="O prazo para pagamento acabou.">
        <Button onClick={onReset}>Gerar novo PIX</Button>
      </Result>
    );
  }

  // Waiting for payment.
  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Valor a pagar</p>
          <p className="font-serif text-3xl font-bold tabular-nums text-foreground">
            {qr.valor !== null
              ? qr.valor.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : "—"}
          </p>
          {estimateLine && (
            <p className="mt-1 text-xs text-muted-foreground">{estimateLine}</p>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          {qr.pixCopiaECola ? (
            <div className="rounded-2xl bg-white p-4">
              <QRCodeSVG value={qr.pixCopiaECola} size={200} level="M" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">QR indisponível.</p>
          )}

          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="w-full gap-2"
            onClick={copy}
            disabled={!qr.pixCopiaECola}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Código copiado" : "Copiar código PIX"}
          </Button>
        </div>

        {secs !== null ? (
          <div
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            role="timer"
            aria-live="polite"
            aria-label={`Expira em ${formatCountdown(secs)}`}
          >
            <Clock className="h-4 w-4" />
            Expira em{" "}
            <span className="font-medium tabular-nums text-foreground">
              {formatCountdown(secs)}
            </span>
          </div>
        ) : (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Aguardando pagamento
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Pague no app do seu banco. O saldo entra quando o pagamento for confirmado.
        </p>
      </CardContent>
    </Card>
  );
}

function Result({
  tone,
  title,
  body,
  children,
}: {
  tone: "success" | "error" | "neutral";
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  const ring =
    tone === "success"
      ? "bg-[#12a46b]/10 text-[#0b6b4f] dark:text-[#7be0b0]"
      : tone === "error"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${ring}`}>
          {tone === "success" ? <Check className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
