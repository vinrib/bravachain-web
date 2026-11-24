import { notFound } from "next/navigation";
import { featureFlags } from "@/lib/feature-flags";

/** Gated by NEXT_PUBLIC_FEATURE_EMPRESA (default OFF). */
export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!featureFlags.empresa) notFound();
  return <>{children}</>;
}
