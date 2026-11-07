import { notFound } from "next/navigation";
import { featureFlags } from "@/lib/feature-flags";

/** Gated by NEXT_PUBLIC_FEATURE_ENVIAR (default OFF) — 404s the whole tree. */
export default function EnviarLayout({ children }: { children: React.ReactNode }) {
  if (!featureFlags.enviar) notFound();
  return <>{children}</>;
}
