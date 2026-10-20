"use client";

import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";

/**
 * GET /v1/onboarding/status (OnboardingController) — KYB status + documentos.
 *
 * O endpoint não tem schema no openapi committado, então o contrato abaixo é
 * o shape real informado pelo backend. Valores de `KybStatus` confirmados:
 * APPROVED, REJECTED e RESUBMIT. PENDING (antes do envio) e SUBMITTED (em
 * análise na Avenia) são os estados do ciclo de envio — ajuste os tokens aqui
 * se o backend usar nomes diferentes para esses dois.
 */
export type KybStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED" | "RESUBMIT";

export interface OnboardingDocument {
  id: string;
  type: string;
  fileName: string;
  fileSizeKb: number;
  uploadedAt: string;
}

export interface OnboardingStatus {
  kybStatus: KybStatus;
  kybSubmittedAt: string | null;
  kybApprovedAt: string | null;
  kybRejectedReason: string | null;
  documents: OnboardingDocument[];
  missingDocuments: string[];
}

/** Nomes legíveis dos tipos de documento do KYB. Chaves desconhecidas caem
 *  no humanize (sem inventar rótulo). */
const DOC_TYPE_LABELS: Record<string, string> = {
  SOCIAL_CONTRACT: "Contrato social",
  ARTICLES_OF_ASSOCIATION: "Contrato social",
  CNPJ_CARD: "Cartão CNPJ",
  CNPJ: "Cartão CNPJ",
  PROOF_OF_ADDRESS: "Comprovante de endereço",
  ADDRESS: "Comprovante de endereço",
  IDENTITY: "Documento de identidade",
  ID: "Documento de identidade",
  SELFIE: "Selfie de verificação",
  REPRESENTATIVE: "Representante legal",
  POWER_OF_ATTORNEY: "Procuração",
};

function humanizeDocType(type: string): string {
  const cleaned = type.replace(/[_-]+/g, " ").trim().toLowerCase();
  if (!cleaned) return "Documento";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Rótulo legível de um tipo de documento (usado em `documents` e
 *  `missingDocuments`). */
export function documentTypeLabel(type: string): string {
  return DOC_TYPE_LABELS[type.toUpperCase()] ?? DOC_TYPE_LABELS[type] ?? humanizeDocType(type);
}

export function getOnboardingStatus(): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>(endpoints.onboarding.status);
}
