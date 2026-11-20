"use client";

import { Check } from "lucide-react";

/**
 * Step indicator for the send flow. Desktop: numbered circles with connectors;
 * mobile: "Etapa N de M" + a segmented bar. `current` is the 0-based index into
 * `steps`. Done steps show a check; the current step is emphasized.
 */
export function StepProgress({
  steps,
  current,
  stepOfLabel,
}: {
  steps: string[];
  current: number;
  /** Localized "Etapa {n} de {total}". */
  stepOfLabel: string;
}) {
  return (
    <>
      {/* Desktop */}
      <ol
        className="hidden items-center gap-2.5 sm:flex"
        aria-label={steps[current]}
      >
        {steps.map((label, i) => {
          const done = i < current;
          const isCurrent = i === current;
          return (
            <li
              key={label}
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center gap-2.5"
              style={{ flex: i < steps.length - 1 ? 1 : "none" }}
            >
              <span
                className={[
                  "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-foreground bg-foreground text-background"
                      : "border-input bg-transparent text-muted-foreground",
                ].join(" ")}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={[
                  "whitespace-nowrap text-[13.5px]",
                  isCurrent
                    ? "font-bold text-foreground"
                    : done
                      ? "text-foreground/80"
                      : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={[
                    "h-0.5 min-w-4 flex-1 rounded",
                    done ? "bg-primary" : "bg-border",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile */}
      <div className="sm:hidden">
        <div className="mb-2 flex justify-between text-[12.5px] text-muted-foreground">
          <span>{stepOfLabel}</span>
          <span className="font-semibold text-foreground/80">{steps[current]}</span>
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {steps.map((label, i) => (
            <span
              key={label}
              className={[
                "h-1 flex-1 rounded",
                i <= current ? "bg-primary" : "bg-border",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </>
  );
}
