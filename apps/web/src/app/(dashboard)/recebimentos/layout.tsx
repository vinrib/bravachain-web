import { notFound } from "next/navigation";
import { featureFlags } from "@/lib/feature-flags";

/**
 * Gates the whole Recebimentos section behind NEXT_PUBLIC_FEATURE_RECEBIMENTOS
 * (default OFF). When off, the routes 404 — defense in depth beyond hiding the
 * menu item.
 */
export default function RecebimentosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!featureFlags.recebimentos) notFound();
  return <>{children}</>;
}
