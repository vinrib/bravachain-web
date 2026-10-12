import { notFound } from "next/navigation";
import { featureFlags } from "@/lib/feature-flags";

/**
 * Gates "Dados de conta" behind NEXT_PUBLIC_FEATURE_DADOS_CONTA (default OFF).
 * Turned on once Avenia provisions the dedicated accounts.
 */
export default function DadosContaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!featureFlags.dadosConta) notFound();
  return <>{children}</>;
}
