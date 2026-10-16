import { notFound } from "next/navigation";
import { featureFlags } from "@/lib/feature-flags";

/** Gated by the Recebimentos flag (same as /recebimentos). */
export default function InstrucoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!featureFlags.recebimentos) notFound();
  return <>{children}</>;
}
