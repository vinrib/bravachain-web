import { cn } from "@/lib/utils";
import { BravaMark } from "./brava-mark";

const SIZES = {
  sm: { box: "h-7 w-7 rounded-lg", mark: 18, word: "text-sm" },
  md: { box: "h-8 w-8 rounded-xl", mark: 22, word: "text-base" },
  lg: { box: "h-12 w-12 rounded-2xl", mark: 30, word: "text-lg" },
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
          // Dark square with the light mark, per the shell artboards.
          "inline-flex items-center justify-center bg-[#011a0f] text-[#8fe3b8] shadow-sm dark:bg-primary dark:text-primary-foreground",
          s.box,
        )}
      >
        <BravaMark size={s.mark} />
      </span>
      {withWordmark && (
        <span className={cn("font-serif font-bold text-foreground", s.word)}>
          Bravachain
        </span>
      )}
    </span>
  );
}
