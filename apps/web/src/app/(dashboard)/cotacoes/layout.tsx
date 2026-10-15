import { notFound } from "next/navigation";
import { featureFlags } from "@/lib/feature-flags";

/** Gated by NEXT_PUBLIC_FEATURE_COTACOES (default OFF). */
export default function CotacoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!featureFlags.cotacoes) notFound();
  return <>{children}</>;
}
