"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import type { PurposeCategory, PurposeItem } from "@/lib/send/types";

/**
 * Searchable two-level purpose picker (categoria → código). Desktop: a dropdown
 * under the trigger; mobile: a bottom sheet with an overlay. Codes are
 * illustrative — the official list comes from Avenia.
 */
export function PurposePicker({
  categories,
  value,
  onChange,
  invalid,
}: {
  categories: PurposeCategory[];
  value: string | null;
  onChange: (code: string) => void;
  invalid?: boolean;
}) {
  const t = useTranslations("enviar");
  const [open, setOpen] = useState(false);
  const [catIndex, setCatIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories]);
  const selected = allItems.find((i) => i.code === value) ?? null;

  const q = query.trim().toLowerCase();
  const items: PurposeItem[] = q
    ? allItems.filter((i) => `${i.code} ${i.name} ${i.category}`.toLowerCase().includes(q))
    : catIndex !== null
      ? (categories[catIndex]?.items ?? [])
      : [];
  const showCategories = !q && catIndex === null;
  const showBack = catIndex !== null && !q;

  function close() {
    setOpen(false);
  }
  function select(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
    setCatIndex(null);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setCatIndex(null);
          setQuery("");
        }}
        className={`flex min-h-[50px] w-full items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
          invalid ? "border-destructive" : open ? "border-foreground" : "border-input"
        }`}
      >
        {selected ? (
          <>
            <span className="shrink-0 font-mono text-[13px] font-medium text-primary">{selected.code}</span>
            <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium">— {selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-[14.5px] text-muted-foreground">{t("details.purposePlaceholder")}</span>
        )}
        <ChevronDown
          className={`h-4.5 w-4.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          {/* Mobile overlay */}
          <button
            type="button"
            aria-label={t("details.close")}
            onClick={close}
            className="fixed inset-0 z-30 bg-foreground/40 sm:hidden"
          />
          <div
            role="listbox"
            aria-label={t("details.purposeLabel")}
            className="fixed inset-x-0 bottom-0 z-40 flex max-h-[74vh] flex-col gap-2.5 rounded-t-3xl border border-border bg-card p-4 pb-8 shadow-2xl sm:absolute sm:inset-x-0 sm:bottom-auto sm:top-[calc(100%+6px)] sm:max-h-[380px] sm:rounded-2xl sm:p-3 sm:pb-3"
          >
            {/* Mobile header */}
            <div className="flex items-center gap-2.5 sm:hidden">
              <div className="font-serif text-lg font-bold flex-1">{t("details.purposeLabel")}</div>
              <button
                type="button"
                aria-label={t("details.close")}
                onClick={close}
                className="flex h-11 w-11 items-center justify-center rounded-xl"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <label className="flex h-11 shrink-0 items-center gap-2.5 rounded-xl border border-input bg-muted/40 px-3">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                aria-label={t("details.purposeSearch")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("details.purposeSearch")}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
              />
            </label>

            {showBack && (
              <button
                type="button"
                onClick={() => setCatIndex(null)}
                className="flex min-h-[40px] items-center gap-2 rounded-lg px-1.5 text-[13.5px] font-bold hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {categories[catIndex!]?.name}
              </button>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto">
              {showCategories &&
                categories.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCatIndex(i)}
                    className="flex min-h-[46px] items-center gap-2.5 rounded-xl px-2.5 text-left hover:bg-muted"
                  >
                    <span className="flex-1 text-[14.5px] font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("details.purposeCount", { count: c.items.length })}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                ))}

              {items.map((it) => {
                const on = it.code === value;
                return (
                  <button
                    key={it.code}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => select(it.code)}
                    className={`flex min-h-[48px] items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left hover:bg-muted ${on ? "bg-primary/10" : ""}`}
                  >
                    <span className="w-12 shrink-0 font-mono text-[12.5px] font-medium text-primary">{it.code}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{it.name}</span>
                      {q && <span className="text-[11.5px] text-muted-foreground">{it.category}</span>}
                    </span>
                    {on && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                  </button>
                );
              })}

              {q && items.length === 0 && (
                <div className="px-2.5 py-4 text-center text-[13.5px] text-muted-foreground">
                  {t("details.purposeEmpty")}
                </div>
              )}
            </div>

            <div className="shrink-0 text-[11.5px] text-muted-foreground">{t("details.purposeIllustrative")}</div>
          </div>
        </>
      )}
    </div>
  );
}
