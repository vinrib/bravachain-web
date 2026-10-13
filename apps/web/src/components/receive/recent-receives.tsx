"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { methodLabel } from "@/lib/receive/labels";
import { getRecentReceives, type RecentReceive } from "@/lib/receive/recent";

export function RecentReceives() {
  const [items, setItems] = useState<RecentReceive[]>([]);

  useEffect(() => {
    // localStorage is client-only; read after mount to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getRecentReceives());
  }, []);

  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-foreground">
        Recebimentos recentes
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Salvos neste navegador (não é a lista oficial).
      </p>
      <div className="space-y-2">
        {items.map((r) => (
          <Link
            key={r.ticketId}
            href={`/recebimentos/${r.ticketId}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {methodLabel(r.method)}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
