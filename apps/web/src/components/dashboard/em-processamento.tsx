"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "@bravachain/shared";
import { getStatement } from "@/lib/statement/api";
import { statementStatusView } from "@/lib/statement/status";

/**
 * "Em processamento" amber summary card (artboard 4a): total of in-progress
 * inbound receivings from /v1/statement. No same-day promise ("previsão hoje")
 * — that would be an unverifiable claim.
 */
export function EmProcessamento() {
  const [total, setTotal] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    getStatement({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      type: "INBOUND",
      page: 1,
      limit: 50,
    })
      .then((r) => {
        if (!active) return;
        const processing = r.transactions.filter(
          (t) => !statementStatusView(t.status).final,
        );
        setTotal(processing.reduce((acc, t) => acc + t.amountBrl, 0));
        setCount(processing.length);
      })
      .catch(() => {
        if (active) setTotal(0);
      });
    return () => {
      active = false;
    };
  }, []);

  if (total === null || total <= 0) return null;

  return (
    <Link
      href="/extrato"
      className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbf0df] px-4 py-3.5 transition-colors hover:bg-[#f7e8cf] dark:bg-[#c77a18]/15 dark:hover:bg-[#c77a18]/20"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#c77a18]" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#8a5310] dark:text-[#d79a3a]">
            Em processamento
          </p>
          <p className="truncate font-serif text-lg font-bold tabular-nums text-[#8a5310] dark:text-[#d79a3a]">
            {/* Desktop keeps the "≈" (approximate sum); mobile matches the mockup. */}
            <span className="hidden md:inline">≈ </span>
            {formatMoney(total)}
          </p>
          {/* Count sub-line is desktop-only — the mockup band is just label + value. */}
          <p className="hidden text-xs text-[#8a5310]/80 dark:text-[#d79a3a]/80 md:block">
            {count} {count === 1 ? "pagamento sendo convertido" : "pagamentos sendo convertidos"}
          </p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#c77a18]" />
    </Link>
  );
}
