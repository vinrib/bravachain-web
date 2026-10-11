"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/client-api";
import { createReceive } from "@/lib/receive/api";
import { addRecentReceive } from "@/lib/receive/recent";
import { UI_METHODS, type UiReceiveMethod } from "@/lib/receive/types";
import { methodLabel } from "@/lib/receive/labels";

const CURRENCY: Record<UiReceiveMethod, string> = {
  USD_WIRE: "USD",
  USD_ACH: "USD",
  EUR_SEPA: "EUR",
};

/** Parses a user-typed amount (accepts pt-BR "1.234,56" or plain "1234.56"). */
function parseAmount(input: string): number | null {
  const cleaned = input.trim().replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function CreateReceiveForm() {
  const router = useRouter();
  const [method, setMethod] = useState<UiReceiveMethod>("USD_WIRE");
  const [amountInput, setAmountInput] = useState("");
  const [pixKeyOverride, setPixKeyOverride] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Idempotency-Key: one per submission body. Reused on retry/double-click with
  // the same body; regenerated when method/amount/pixKey change.
  const idemRef = useRef<{ sig: string; key: string } | null>(null);
  function idempotencyKeyFor(sig: string): string {
    if (idemRef.current?.sig === sig) return idemRef.current.key;
    const key = crypto.randomUUID();
    idemRef.current = { sig, key };
    return key;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseAmount(amountInput);
    if (amount === null) {
      setErrors({ amount: "Informe um valor válido." });
      return;
    }
    setErrors({});
    const pixKey = pixKeyOverride.trim() || undefined;
    const body = { method, amount, pixKey };
    const sig = `${method}|${amount}|${pixKey ?? ""}`;
    const key = idempotencyKeyFor(sig);

    setSubmitting(true);
    try {
      const res = await createReceive(body, key);
      addRecentReceive({
        ticketId: res.ticketId,
        shareToken: res.shareToken,
        method: res.method,
        inputCurrency: res.inputCurrency,
        createdAt: new Date().toISOString(),
      });
      router.push(`/recebimentos/${res.ticketId}`);
    } catch (err) {
      setErrors({
        form:
          err instanceof ApiError
            ? err.message
            : "Não foi possível criar o recebimento.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo recebimento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Como vai receber</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {UI_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                    method === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {methodLabel(m)}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={`Valor a receber (${CURRENCY[method]})`}
            value={amountInput}
            onChange={(e) => {
              setAmountInput(e.target.value);
              setErrors((p) => ({ ...p, amount: undefined }));
            }}
            inputMode="decimal"
            placeholder="0,00"
            prefix={CURRENCY[method]}
            error={errors.amount}
          />

          <Input
            label="Chave PIX de destino (opcional)"
            value={pixKeyOverride}
            onChange={(e) => setPixKeyOverride(e.target.value)}
            placeholder="Usar chave padrão"
          />

          {errors.form && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{errors.form}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
            {submitting ? (
              <Spinner size="sm" />
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4" />
                Gerar instruções de pagamento
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
