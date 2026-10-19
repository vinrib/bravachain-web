import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyFlag } from "@/components/ui/flags";
import { currencyTitle, pendingAccountText } from "@/lib/receive/account-content";

/** A currency whose dedicated account is still being set up (no values/copy). */
export function PendingAccountCard({ currency }: { currency: string }) {
  const hasFlag = currency === "USD" || currency === "EUR" || currency === "BRL";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          {hasFlag ? (
            // Flag with a small "em ativação" clock badge in the corner.
            <div className="relative shrink-0">
              <CurrencyFlag currency={currency} size={36} />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-2 ring-card">
                <Clock className="h-2.5 w-2.5 text-white" />
              </span>
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {currencyTitle(currency)}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {pendingAccountText(currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
