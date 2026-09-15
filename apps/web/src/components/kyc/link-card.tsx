"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A single verification link. For PJ onboarding two of these are shown — one
 * for the company data and one for the legal representative — and each can be
 * copied and forwarded to a different person.
 */
export function VerificationLinkCard({
  step,
  title,
  description,
  url,
  audience,
}: {
  step?: number;
  title: string;
  description: string;
  url: string;
  /** Who typically completes this step, e.g. "Representante legal". */
  audience?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable; the Abrir button still works */
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        {step !== undefined && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {step}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {audience && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {audience}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="sm" className="gap-2">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Abrir verificação
              </a>
            </Button>
            <Button variant="secondary" size="sm" className="gap-2" onClick={copy}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? "Link copiado" : "Copiar link"}
            </Button>
          </div>

          {/* Show the raw URL so it can be forwarded by e-mail/WhatsApp too. */}
          <p className="mt-2 break-all rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {url}
          </p>
        </div>
      </div>
    </div>
  );
}
