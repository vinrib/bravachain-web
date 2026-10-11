"use client";

import { useState } from "react";
import { Check, Copy, Link2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { featureFlags } from "@/lib/feature-flags";
import { renewShareToken } from "@/lib/receive/api";

interface ShareLinkCardProps {
  shareToken: string;
  expiresAt?: string;
  /**
   * Internal InboundRemittance.id, required by renew-token. Not available from
   * the API today, so the renew button stays hidden until the backend provides
   * it (also gated by NEXT_PUBLIC_FEATURE_RECEBIMENTOS_RENEW).
   */
  renewId?: string;
}

export function ShareLinkCard({ shareToken, expiresAt, renewId }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/pay/${shareToken}`
      : `/pay/${shareToken}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* leave visible for manual copy */
    }
  }

  async function renew() {
    if (!renewId) return;
    setRenewing(true);
    setRenewError(null);
    try {
      await renewShareToken(renewId);
      window.location.reload();
    } catch {
      setRenewError("Não foi possível renovar o link.");
    } finally {
      setRenewing(false);
    }
  }

  const showRenew = featureFlags.recebimentosRenew && Boolean(renewId);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Link para o pagador</p>
      </div>
      <p className="break-all rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
        {url}
      </p>
      {expiresAt && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Válido até {new Date(expiresAt).toLocaleDateString("pt-BR")}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={copy} className="gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar link"}
        </Button>
        {showRenew && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={renew}
            disabled={renewing}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Renovar link
          </Button>
        )}
      </div>
      {renewError && <p className="mt-2 text-sm text-destructive">{renewError}</p>}
    </div>
  );
}
