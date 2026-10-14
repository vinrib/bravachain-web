import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "h-7 w-7 rounded-lg text-sm", word: "text-sm" },
  md: { box: "h-8 w-8 rounded-xl text-base", word: "text-base" },
  lg: { box: "h-12 w-12 rounded-2xl text-2xl", word: "text-lg" },
} as const;

/**
 * Bravachain logo — brand mark ("B") + Merriweather wordmark, per the Claude
 * Design identity. Used in the sidebar, mobile header and auth brand panel.
 */
export function Logo({
  size = "md",
  withWordmark = true,
  className,
}: {
  size?: keyof typeof SIZES;
  withWordmark?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center bg-primary font-serif font-bold leading-none text-primary-foreground shadow-sm",
          s.box,
        )}
      >
        B
      </span>
      {withWordmark && (
        <span className={cn("font-serif font-bold text-foreground", s.word)}>
          Bravachain
        </span>
      )}
    </span>
  );
}
