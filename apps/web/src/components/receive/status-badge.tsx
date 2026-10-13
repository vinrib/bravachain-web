import { cn } from "@/lib/utils";
import { statusView, type StatusTone } from "@/lib/receive/labels";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  error: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const { label, tone } = statusView(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
      )}
    >
      {label}
    </span>
  );
}
