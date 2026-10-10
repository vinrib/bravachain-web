import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

/**
 * Accessible checkbox built on a native `<input type="checkbox">` so form
 * semantics, keyboard handling, and screen-reader support come for free. The
 * native box is visually hidden (`peer`) and a styled box tracks its state.
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id ?? (typeof label === "string"
      ? `cb-${label.toLowerCase().replace(/\s/g, "-")}`
      : undefined);
    return (
      <label
        htmlFor={inputId}
        className="inline-flex cursor-pointer items-center gap-2 select-none"
      >
        <span className="relative inline-flex h-4 w-4">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          {/* Box and check are both direct siblings of the peer input so
              `peer-checked:` can style them; the check is layered on top. */}
          <span
            className={cn(
              "absolute inset-0 rounded border border-border bg-input transition-colors",
              "peer-checked:border-primary peer-checked:bg-primary",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background",
              className,
            )}
          />
          <svg
            className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 6.2l2.2 2.3L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {label && (
          <span className="text-sm text-muted-foreground">{label}</span>
        )}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
