import { cn } from "@/lib/utils";
import { statusClasses, type StatusTone } from "@/lib/statement/status";

/**
 * Status etiqueta (Processando / Concluído / Falhou / Em verificação…) — a pill
 * with a colored dot, matching the design. Tone drives the colors; label is the
 * pt-BR text. Reused across Extrato, Recebimentos and Saque.
 */
export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: StatusTone;
  className?: string;
}) {
  const { pill, dot } = statusClasses(tone);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        pill,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
