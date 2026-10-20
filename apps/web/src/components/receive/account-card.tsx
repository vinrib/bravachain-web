"use client";

import { useState } from "react";
import { Check, Copy, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyFlag } from "@/components/ui/flags";
import { CopyField } from "./copy-field";
import { DICT } from "@/lib/receive/i18n";
import {
  accountFields,
  copyAllText,
  currencyTitle,
  settlementFor,
} from "@/lib/receive/account-content";
import type { DedicatedAccount } from "@/lib/receive/types";

export function AccountCard({ account }: { account: DedicatedAccount }) {
  const [copied, setCopied] = useState(false);
  const fields = accountFields(account);
  const settlement = settlementFor(account.currency);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(copyAllText(fields));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* leave fields visible for manual copy */
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CurrencyFlag currency={account.currency} size={32} />
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {currencyTitle(account.currency)}
              </h2>
              {account.confirmedAt && (
                <p className="text-xs text-muted-foreground">
                  Confirmada em{" "}
                  {new Date(account.confirmedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>
          {fields.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={copyAll}
              className="gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar todos"}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {fields.map((f) => (
            <CopyField
              key={f.key}
              label={f.label}
              value={f.value}
              dict={DICT.pt}
              emphasize={f.key === "reference"}
            />
          ))}
        </div>

        {settlement && settlement.lines.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Prazo de liquidação</p>
              {settlement.lines.map((s) => (
                <p key={s.method}>
                  {s.method}: {s.time}
                </p>
              ))}
              {settlement.note && (
                <p className="text-xs text-muted-foreground/80">{settlement.note}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
