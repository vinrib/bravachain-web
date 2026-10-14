import { formatMoney } from "@bravachain/shared";

/**
 * Compact gross / fee / net line for a withdrawal. Shows the fee and net only
 * when both are present; otherwise "—" (never invented).
 */
export function WithdrawBreakdown({
  gross,
  fee,
  net,
}: {
  gross: number;
  fee: number | null;
  net: number | null;
}) {
  const has = fee !== null && net !== null;
  return (
    <p className="text-xs text-muted-foreground tabular-nums">
      Bruto {formatMoney(gross)} · Tarifa {has ? formatMoney(fee!) : "—"} · Líquido{" "}
      {has ? formatMoney(net!) : "—"}
    </p>
  );
}
