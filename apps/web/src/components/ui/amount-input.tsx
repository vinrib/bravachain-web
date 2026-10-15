"use client";

import { cn } from "@/lib/utils";

/**
 * Large money input (Saque / valor): a smaller "R$" prefix and the amount in
 * Merriweather, with an underline — per the design's value field. Controlled;
 * formatting/parsing stays with the caller.
 */
export function AmountInput({
  value,
  onChange,
  placeholder = "0,00",
  error,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className={cn(
          "flex items-baseline gap-2 border-b-2 pb-1.5 transition-colors",
          error ? "border-destructive" : "border-border focus-within:border-primary",
        )}
      >
        <span className="font-serif text-xl font-bold text-muted-foreground">R$</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          placeholder={placeholder}
          className="w-full bg-transparent font-serif text-4xl font-bold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}
