/**
 * Round country/region flags as inline SVG (no external dependency). Sized 28px
 * by default; clipped to a circle. Simplified but recognizable.
 */

function star(cx: number, cy: number, r = 2.2) {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI / 180) * (72 * i - 90);
    const ai = a + (Math.PI / 180) * 36;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
    pts.push(`${(cx + r * 0.42 * Math.cos(ai)).toFixed(2)},${(cy + r * 0.42 * Math.sin(ai)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function Round({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
      style={{ display: "block", flex: "none" }}
    >
      <defs>
        <clipPath id="flag-clip">
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath="url(#flag-clip)">{children}</g>
      <circle cx="32" cy="32" r="31.5" fill="none" stroke="rgba(0,0,0,.08)" />
    </svg>
  );
}

export function FlagBR({ size = 28 }: { size?: number }) {
  return (
    <Round size={size}>
      <rect width="64" height="64" fill="#009b3a" />
      <polygon points="32,10 58,32 32,54 6,32" fill="#fedf00" />
      <circle cx="32" cy="32" r="12" fill="#002776" />
      <path d="M22 30 a12 12 0 0 1 20 4" fill="none" stroke="#fff" strokeWidth="2.5" />
    </Round>
  );
}

export function FlagUS({ size = 28 }: { size?: number }) {
  const stripes = [];
  for (let i = 0; i < 13; i++) {
    stripes.push(
      <rect key={i} y={(i * 64) / 13} width="64" height={64 / 13} fill={i % 2 === 0 ? "#b22234" : "#fff"} />,
    );
  }
  return (
    <Round size={size}>
      {stripes}
      <rect width="30" height={(64 / 13) * 7} fill="#3c3b6e" />
      {[6, 14, 22].map((cx) =>
        [6, 14, 22, 30].map((cy) => (
          <polygon key={`${cx}-${cy}`} points={star(cx, cy, 1.8)} fill="#fff" />
        )),
      )}
    </Round>
  );
}

export function FlagEU({ size = 28 }: { size?: number }) {
  const stars = [];
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI / 180) * (30 * i - 90);
    stars.push(
      <polygon
        key={i}
        points={star(32 + 18 * Math.cos(a), 32 + 18 * Math.sin(a), 3)}
        fill="#ffcc00"
      />,
    );
  }
  return (
    <Round size={size}>
      <rect width="64" height="64" fill="#003399" />
      {stars}
    </Round>
  );
}

/** Pick a flag by currency; returns null for unknown. */
export function CurrencyFlag({ currency, size = 28 }: { currency: string; size?: number }) {
  if (currency === "BRL") return <FlagBR size={size} />;
  if (currency === "USD") return <FlagUS size={size} />;
  if (currency === "EUR") return <FlagEU size={size} />;
  return null;
}
