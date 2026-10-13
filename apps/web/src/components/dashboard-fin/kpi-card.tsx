import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatVariation } from "@/lib/dashboard/chart";

export function MetricDelta({ variation }: { variation: number | null }) {
  const v = formatVariation(variation);
  if (!v) return null;
  const Icon = v.dir > 0 ? ArrowUpRight : v.dir < 0 ? ArrowDownRight : null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        v.dir > 0 && "text-success",
        v.dir < 0 && "text-destructive",
        v.dir === 0 && "text-muted-foreground",
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {v.text}
    </span>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  variation?: number | null;
  caption?: string;
}

export function KpiCard({ label, value, variation, caption }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{value}</p>
        {(variation !== undefined || caption) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {variation !== undefined && <MetricDelta variation={variation ?? null} />}
            {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
