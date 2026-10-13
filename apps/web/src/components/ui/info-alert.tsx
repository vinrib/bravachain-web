import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Informative (non-destructive) callout. Neutral by default; matches the
 * existing inline-notice pattern used across the app.
 */
export function InfoAlert({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5",
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
