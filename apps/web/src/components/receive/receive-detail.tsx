"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InstructionsView } from "./instructions-view";
import { StatusBadge } from "./status-badge";
import { ShareLinkCard } from "./share-link-card";
import { DICT } from "@/lib/receive/i18n";
import { getInstructions, getStatus } from "@/lib/receive/api";
import { getRecentReceives } from "@/lib/receive/recent";
import type { Instructions, ReceiveStatus } from "@/lib/receive/types";

export function ReceiveDetail({ ticketId }: { ticketId: string }) {
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [status, setStatus] = useState<ReceiveStatus | null>(null);
  const [shareToken, setShareToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [instr, st] = await Promise.all([
        getInstructions(ticketId),
        getStatus(ticketId).catch(() => null),
      ]);
      setInstructions(instr);
      setStatus(st);
    } catch {
      setError("Não foi possível carregar o recebimento.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    // Share token isn't returned by instructions/status; recover it from the
    // device's recent list when available (for the shareable link + PDF).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShareToken(getRecentReceives().find((r) => r.ticketId === ticketId)?.shareToken);
    void load();
  }, [ticketId, load]);

  async function refreshStatus() {
    setRefreshingStatus(true);
    try {
      setStatus(await getStatus(ticketId));
    } catch {
      /* keep previous status */
    } finally {
      setRefreshingStatus(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href="/recebimentos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Recebimentos
      </Link>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button type="button" variant="secondary" className="mt-4" onClick={load}>
            Tentar novamente
          </Button>
        </div>
      ) : instructions ? (
        <>
          {status && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <StatusBadge status={status.status} />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={refreshStatus}
                disabled={refreshingStatus}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </Button>
            </div>
          )}

          <InstructionsView
            data={instructions}
            dict={DICT.pt}
            pdfHref={shareToken ? `/api/receive/pay/${shareToken}/pdf` : undefined}
          />

          {shareToken && (
            <ShareLinkCard shareToken={shareToken} />
          )}
        </>
      ) : null}
    </div>
  );
}
