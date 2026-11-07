"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Lock, ShieldCheck, ShieldAlert } from "lucide-react";
import { CurrencyFlag } from "@/components/ui/flags";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/state";
import { useKycState } from "@/lib/hooks";
import { getSendChannels } from "@/lib/send/api";
import {
  CURRENCY_SLUG,
  SEND_CURRENCIES,
  type SendChannel,
  type SendCurrency,
} from "@/lib/send/types";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; channels: SendChannel[] };

/**
 * Step 1 of "Enviar": pick the payment currency. A card is selectable only when
 * the API returns `available: true` for that channel (enablement is Avenia's,
 * never Bravachain's). With identity verification pending, every card is
 * disabled and a notice points to /verificacao.
 */
export function CurrencyChoice() {
  const t = useTranslations("enviar");
  const router = useRouter();
  const kyc = useKycState();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    // Initial state is already "loading"; only the async result updates it.
    let active = true;
    getSendChannels()
      .then((channels) => active && setState({ status: "ready", channels }))
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
    };
  }, []);

  function reload() {
    setState({ status: "loading" });
    getSendChannels()
      .then((channels) => setState({ status: "ready", channels }))
      .catch(() => setState({ status: "error" }));
  }

  if (state.status === "error") {
    return <ErrorState message={t("error.body")} onRetry={reload} />;
  }

  // KYC still resolving or channels loading → skeletons.
  const loading = state.status === "loading" || kyc.loading;
  const kycApproved = kyc.data?.status === "approved";
  const kycPending = !kyc.loading && !kycApproved;

  const byCurrency = new Map<SendCurrency, SendChannel>(
    state.status === "ready" ? state.channels.map((c) => [c.currency, c]) : [],
  );

  return (
    <div className="space-y-4">
      {kycPending && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3.5 text-warning"
        >
          <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="flex-1 text-sm font-semibold">{t("kyc.message")}</p>
          <Link
            href="/verificacao"
            className="inline-flex min-h-[40px] items-center rounded-xl border border-current px-4 text-sm font-semibold hover:bg-warning/10"
          >
            {t("kyc.cta")}
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? SEND_CURRENCIES.map((c) => <CardSkeleton key={c} />)
          : SEND_CURRENCIES.map((currency) => {
              const channel = byCurrency.get(currency);
              const selectable = !kycPending && channel?.available === true;
              return (
                <CurrencyCard
                  key={currency}
                  currency={currency}
                  selectable={selectable}
                  // Grey "Habilitação feita pela Avenia" only when the channel
                  // itself is off — not when the whole screen is KYC-gated.
                  unavailable={!kycPending && channel?.available === false}
                  title={t("card.title", { currency })}
                  description={t(`card.desc.${currency}`)}
                  unavailableLabel={t("card.unavailable")}
                  onSelect={() => router.push(`/enviar/${CURRENCY_SLUG[currency]}`)}
                />
              );
            })}
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {t("footer.executedByAvenia")}
      </p>
    </div>
  );
}

function CurrencyCard({
  currency,
  selectable,
  unavailable,
  title,
  description,
  unavailableLabel,
  onSelect,
}: {
  currency: SendCurrency;
  selectable: boolean;
  unavailable: boolean;
  title: string;
  description: string;
  unavailableLabel: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={selectable ? onSelect : undefined}
      disabled={!selectable}
      aria-disabled={!selectable}
      className={[
        "group flex min-h-[200px] flex-col items-start gap-3 rounded-2xl border p-6 text-left outline-none transition-colors",
        "focus-visible:ring-3 focus-visible:ring-ring/40",
        selectable
          ? "cursor-pointer border-border bg-card hover:border-primary"
          : "cursor-default border-border bg-muted",
      ].join(" ")}
    >
      <span className={unavailable ? "grayscale opacity-60" : undefined}>
        <CurrencyFlag currency={currency} size={56} />
      </span>
      <span className="flex-1" />
      <span
        className={[
          "font-serif text-xl font-bold",
          selectable ? "text-foreground" : "text-muted-foreground",
        ].join(" ")}
      >
        {title}
      </span>
      <span className="text-sm leading-snug text-muted-foreground">{description}</span>
      {unavailable ? (
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          <Lock className="h-3 w-3" aria-hidden="true" />
          {unavailableLabel}
        </span>
      ) : selectable ? (
        <ArrowRight className="mt-1 h-5 w-5 self-end text-primary" aria-hidden="true" />
      ) : null}
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="flex min-h-[200px] flex-col gap-3 rounded-2xl border border-border bg-card p-6">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div className="flex-1" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}
