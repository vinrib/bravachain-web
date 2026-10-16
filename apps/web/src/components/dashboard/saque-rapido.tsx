"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { Card, CardContent } from "@/components/ui/card";
import { AmountInput } from "@/components/ui/amount-input";
import { useBalance } from "@/lib/hooks";
import { getPixKey } from "@/lib/receive/api";

/**
 * "Saque rápido" (artboard 3a): a value field whose button takes the user to the
 * Saque screen (8a) with the amount prefilled — it never moves money in one
 * click (review + PIX-return warning live on /saque). The standing PIX key is
 * shown only as a suggestion if the backend has one; never an example key.
 */
export function SaqueRapido() {
  const router = useRouter();
  const balance = useBalance();
  const [valor, setValor] = useState("");
  const [pixKey, setPixKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPixKey()
      .then((r) => {
        if (active) setPixKey(r.pixKey ?? null);
      })
      .catch(() => {
        /* no standing key — just show the value field */
      });
    return () => {
      active = false;
    };
  }, []);

  function goToSaque() {
    const q = valor.trim() ? `?valor=${encodeURIComponent(valor.trim())}` : "";
    router.push(`/saque${q}`);
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-semibold text-foreground">Saque rápido via PIX</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Disponível{" "}
          <span className="font-medium text-foreground tabular-nums">
            {balance.loading
              ? "…"
              : formatMoney(balance.data?.available ?? 0, {
                  currency: balance.data?.currency ?? "BRL",
                })}
          </span>
        </p>

        <div className="mt-3">
          <label className="text-xs text-muted-foreground">Valor a sacar</label>
          <AmountInput value={valor} onChange={setValor} className="mt-1" />
        </div>

        {pixKey && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
            <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Chave cadastrada para recebimentos</p>
              <p className="truncate text-sm font-medium text-foreground">{pixKey}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={goToSaque}
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#011a0f] text-sm font-semibold text-white hover:bg-[#0b3b2e] dark:bg-primary dark:text-primary-foreground"
        >
          Solicitar saque
          <ArrowRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
