import { notFound } from "next/navigation";
import { featureFlags } from "@/lib/feature-flags";

/** Gated by NEXT_PUBLIC_FEATURE_DEPOSITO (default OFF). */
export default function DepositoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!featureFlags.deposito) notFound();
  return <>{children}</>;
}
