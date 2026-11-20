"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Plus, Search, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { getBeneficiaries } from "@/lib/send/api";
import type { BeneficiarySummary, SendCurrency } from "@/lib/send/types";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: BeneficiarySummary[] };

/**
 * Step 1 content: pick a saved beneficiary or register a new one. Shows only
 * the masked summary the API returns — never full account/key data.
 */
export function BeneficiaryStep({
  currency,
  onSelect,
  onRegister,
}: {
  currency: SendCurrency;
  onSelect: (b: BeneficiarySummary) => void;
  onRegister: () => void;
}) {
  const t = useTranslations("enviar");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    getBeneficiaries(currency)
      .then((items) => active && setState({ status: "ready", items }))
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
    };
  }, [currency]);

  function reload() {
    setState({ status: "loading" });
    getBeneficiaries(currency)
      .then((items) => setState({ status: "ready", items }))
      .catch(() => setState({ status: "error" }));
  }

  const filtered = useMemo(() => {
    if (state.status !== "ready") return [];
    const q = query.trim().toLowerCase();
    if (!q) return state.items;
    return state.items.filter((b) =>
      `${b.name} ${b.line}`.toLowerCase().includes(q),
    );
  }, [state, query]);

  if (state.status === "error") {
    return <ErrorState message={t("error.body")} onRetry={reload} />;
  }

  const loading = state.status === "loading";
  const hasList = !loading && filtered.length > 0;
  const emptyFiltered = !loading && filtered.length === 0;
  const hasAnySaved = state.status === "ready" && state.items.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2.5">
        <label className="flex h-12 flex-1 basis-60 items-center gap-2.5 rounded-xl border border-input bg-card px-3.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            aria-label={t("beneficiary.searchLabel")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("beneficiary.searchLabel")}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <button
          type="button"
          onClick={onRegister}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-input bg-card px-4 text-sm font-semibold text-foreground outline-none transition-colors hover:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("beneficiary.register")}
        </button>
      </div>

      {loading && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex items-center gap-3.5 px-4.5 py-3.5 ${i ? "border-t border-border" : ""}`}
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))}
        </div>
      )}

      {hasList && (
        <>
          <p className="text-[13px] font-semibold text-foreground/80">
            {t("beneficiary.savedCount", { currency })}
          </p>
          <ul className="overflow-hidden rounded-2xl border border-border bg-card">
            {filtered.map((b, i) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onSelect(b)}
                  className={`flex w-full items-center gap-3.5 px-4.5 py-3.5 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 ${i ? "border-t border-border" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                  >
                    {b.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-foreground">
                      {b.name}
                    </span>
                    <span className="block truncate text-[12.5px] text-muted-foreground">
                      {b.line}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-semibold text-foreground/80">
                    {b.railLabel}
                  </span>
                  <ChevronRight
                    className="h-4.5 w-4.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {emptyFiltered && (
        <EmptyState
          icon={Users}
          title={
            hasAnySaved
              ? t("beneficiary.emptySearchTitle")
              : t("beneficiary.emptyTitle", { currency })
          }
          description={
            hasAnySaved
              ? t("beneficiary.emptySearchDesc")
              : t("beneficiary.emptyDesc", { currency })
          }
        />
      )}
    </div>
  );
}
