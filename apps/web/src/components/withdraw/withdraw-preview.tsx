"use client";

import { AlertCircle } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { formatBrlDecimal } from "@/lib/deposit/money";
import type { PreviewState } from "@/lib/withdraw/use-preview";

/**
 * Bloco "Valor solicitado · Tarifa · Você recebe" antes de confirmar o saque.
 * Mostra só dados vindos do backend (nenhuma tarifa fixa no front). Em erro,
 * exibe um aviso e NÃO bloqueia a confirmação — o líquido aparece no comprovante.
 */
export function WithdrawPreview({
  requestedAmount,
  preview,
}: {
  /** Valor digitado localmente (BRL), para rotular enquanto a prévia carrega. */
  requestedAmount: number | null;
  preview: PreviewState;
}) {
  // Nada a mostrar sem um valor válido.
  if (requestedAmount === null || requestedAmount <= 0) return null;

  const { data, loading, error } = preview;

  const requestedLabel =
    formatBrlDecimal(data?.amountBrla) ?? formatMoney(requestedAmount);
  const feeLabel = formatBrlDecimal(data?.feeBrl);
  const netLabel = formatBrlDecimal(data?.netAmountBrl);
  const placeholder = loading ? "…" : "—";

  return (
    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
      <dl className="space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Valor solicitado</dt>
          <dd className="tabular-nums text-foreground">{requestedLabel}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Tarifa</dt>
          <dd className="tabular-nums text-foreground">{feeLabel ?? placeholder}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-1">
          <dt className="font-medium text-foreground">Você recebe</dt>
          <dd className="font-semibold tabular-nums text-foreground">
            {netLabel ?? placeholder}
          </dd>
        </div>
      </dl>

      {error && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Não foi possível calcular a tarifa agora. Você pode continuar — o valor
            líquido aparece no comprovante.
          </p>
        </div>
      )}
    </div>
  );
}
