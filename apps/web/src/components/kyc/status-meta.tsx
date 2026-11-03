import { ShieldCheck, Clock, AlertCircle, XCircle, FileText } from "lucide-react";
import type { KycStatus } from "@bravachain/shared";

export interface KycStatusMeta {
  label: string;
  badge: "success" | "warning" | "destructive" | "default" | "info";
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

/**
 * Single mapping from the normalized KYC/KYB status to its UI presentation.
 * Reused by the dashboard banner and the verification/return screens so the
 * copy stays consistent.
 */
export const kycStatusMeta: Record<KycStatus, KycStatusMeta> = {
  approved: {
    label: "Aprovado",
    badge: "success",
    Icon: ShieldCheck,
    title: "Verificação aprovada",
    description:
      "A sua empresa foi verificada pela Avenia. Você tem acesso completo à plataforma, incluindo saques via PIX.",
  },
  under_review: {
    label: "Em análise",
    badge: "warning",
    Icon: Clock,
    title: "Verificação em análise",
    description:
      "Recebemos seus dados e a Avenia, parceira de pagamentos da Bravachain, está analisando o cadastro. O prazo depende da Avenia; mostraremos o resultado aqui assim que ela responder.",
  },
  pending: {
    label: "Pendente",
    badge: "info",
    Icon: FileText,
    title: "Verificação pendente",
    description:
      "Os links de verificação foram gerados. Conclua as etapas abaixo para concluir a verificação.",
  },
  rejected: {
    label: "Rejeitado",
    badge: "destructive",
    Icon: XCircle,
    title: "Verificação não aprovada",
    description:
      "A verificação não foi concluída pela Avenia. Revise os dados e tente novamente.",
  },
  not_started: {
    label: "Não iniciado",
    badge: "default",
    Icon: AlertCircle,
    title: "Verificação necessária",
    description:
      "Para movimentar a conta e sacar via PIX, conclua a verificação (KYB) da empresa.",
  },
};
