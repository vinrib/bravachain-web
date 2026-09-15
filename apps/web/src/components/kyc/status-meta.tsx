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
      "A cooperativa está verificada. Você tem acesso completo à plataforma, incluindo saques via PIX.",
  },
  under_review: {
    label: "Em análise",
    badge: "warning",
    Icon: Clock,
    title: "Verificação em análise",
    description:
      "Recebemos os dados e estamos analisando. Isso costuma levar até 2 dias úteis — avisaremos assim que concluir.",
  },
  pending: {
    label: "Pendente",
    badge: "info",
    Icon: FileText,
    title: "Verificação pendente",
    description:
      "Os links de verificação foram gerados. Conclua as etapas abaixo para liberar a conta.",
  },
  rejected: {
    label: "Rejeitado",
    badge: "destructive",
    Icon: XCircle,
    title: "Verificação não aprovada",
    description:
      "Não foi possível concluir a verificação. Revise os dados e tente novamente.",
  },
  not_started: {
    label: "Não iniciado",
    badge: "default",
    Icon: AlertCircle,
    title: "Verificação necessária",
    description:
      "Para movimentar a conta e sacar via PIX, conclua a verificação (KYB) da cooperativa.",
  },
};
