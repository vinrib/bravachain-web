import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, suffix, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex h-12 items-center gap-2 rounded-xl border border-border bg-input px-4 transition-colors",
            "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20",
            error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
            className
          )}
        >
          {prefix && <span className="text-muted-foreground shrink-0">{prefix}</span>}
          <input
            id={inputId}
            ref={ref}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            {...props}
          />
          {suffix && <span className="text-muted-foreground shrink-0">{suffix}</span>}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
