"use client";

import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  badge?: number;
}

/**
 * Pill tabs with optional count badges, per the design (active = elevated
 * paper surface). Reused by Extrato / Recebimentos.
 */
export function TabsPill<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<TabItem<T>>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/50 p-1",
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  active ? "bg-primary/10 text-primary" : "bg-border/60 text-muted-foreground",
                )}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
