import { cn } from "@/lib/utils";
import type { Currency } from "@/lib/types";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

interface CurrencyIconProps {
  currency: Currency;
  size?: IconSize;
  className?: string;
  /** Show country flag badge overlay (default true) */
  showFlag?: boolean;
}

const SIZE_PX: Record<IconSize, number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

const BADGE_PX: Record<IconSize, number> = {
  xs: 10,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 26,
};

const FLAG_FONT: Record<IconSize, number> = {
  xs: 7,
  sm: 9,
  md: 11,
  lg: 14,
  xl: 18,
};

/** Country flag emoji for each currency */
const CURRENCY_FLAG: Record<Currency, string> = {
  BRL: "🇧🇷",
  USDC: "🇺🇸",
  EURC: "🇪🇺",
  BRZ: "🇧🇷",
};

/**
 * CurrencyIcon — circular token logo with a country flag badge.
 *
 * Token logos come from /public/icons/{currency}.svg
 * (usdc.svg from cryptocurrency-icons; brl, brz, eurc are custom).
 */
export function CurrencyIcon({
  currency,
  size = "md",
  className,
  showFlag = true,
}: CurrencyIconProps) {
  const mainPx = SIZE_PX[size];
  const badgePx = BADGE_PX[size];
  const flagFont = FLAG_FONT[size];
  const flag = CURRENCY_FLAG[currency];

  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: mainPx, height: mainPx }}
    >
      {/* Token logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/icons/${currency.toLowerCase()}.svg`}
        alt={currency}
        width={mainPx}
        height={mainPx}
        className="rounded-full"
        style={{ width: mainPx, height: mainPx, objectFit: "cover" }}
      />

      {/* Flag badge */}
      {showFlag && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-white ring-1 ring-white shadow-sm leading-none"
          style={{
            width: badgePx,
            height: badgePx,
            fontSize: flagFont,
          }}
        >
          {flag}
        </span>
      )}
    </div>
  );
}

/** Inline label: icon + currency code */
export function CurrencyLabel({
  currency,
  size = "sm",
  className,
}: {
  currency: Currency;
  size?: IconSize;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CurrencyIcon currency={currency} size={size} showFlag={false} />
      <span className="font-semibold">{currency}</span>
    </span>
  );
}
