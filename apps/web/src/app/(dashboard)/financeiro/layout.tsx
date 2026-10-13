import { notFound } from "next/navigation";
import { featureFlags } from "@/lib/feature-flags";

/** Gates the dashboard behind NEXT_PUBLIC_FEATURE_DASHBOARD (default OFF). */
export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!featureFlags.dashboard) notFound();
  return <>{children}</>;
}
