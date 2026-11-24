import type { BackendKybDocumentType, CompanyLimitScope } from "./constants";

export type AveniaStatusKind =
  | "approved"
  | "in_analysis"
  | "pending"
  | "unavailable";

export interface CompanyProfile {
  /** Optional display title from `/v1/profile/branding` or `/auth/me` (never mislabeled as Razão Social). */
  displayName: string | null;
  /** Legal name ONLY when provided by a real backend endpoint; otherwise null (hidden). */
  legalName: string | null;
  /** CNPJ ONLY when provided by a real backend endpoint; otherwise null (hidden). */
  cnpj: string | null;
  /** CNAE ONLY when provided by a real backend endpoint; otherwise null (hidden). */
  cnae: string | null;
  /** Real email from `GET /auth/me`; null when absent (hidden). */
  email: string | null;
  aveniaStatusKind: AveniaStatusKind;
  aveniaStatusLabel: string;
}

export interface PepPartner {
  id: string;
  name: string;
  role: string;
  ownership: string;
  /** Always masked before display (e.g. `***.456.789-**`). */
  cpfMasked: string;
  isPep: boolean;
}

export type CompanyDocumentKind = "uploaded" | "pending";

export interface CompanyDocument {
  id: string;
  /** Present ONLY when backed by `POST /v1/onboarding/documents/:type`. */
  apiType: BackendKybDocumentType | null;
  name: string;
  category: string;
  fileName: string | null;
  /** Formatted display date `dd/mm/yyyy` (America/Sao_Paulo) or null. */
  uploadedAtLabel: string | null;
  /** Formatted display day/month `dd/mm` (America/Sao_Paulo) or null. */
  uploadedDayMonthLabel: string | null;
  kind: CompanyDocumentKind;
  /** Strictly `"Enviado em dd/mm"` (or `"Enviado"`) or `"Pendente de envio"`. Never `"Aprovado pela Avenia"`. */
  statusLabel: string;
}

export interface CompanyLimitValue {
  used: number | null;
  max: number | null;
  unit: string;
}

export interface CompanyLimitRow {
  id: string;
  scope: CompanyLimitScope | string;
  label: string;
  isGlobal: boolean;
  entry: CompanyLimitValue;
  exit: CompanyLimitValue;
}

export interface CompanyBundle {
  profile: CompanyProfile | null;
  profileError: boolean;
  aveniaStatusKind: AveniaStatusKind;
  aveniaStatusLabel: string;
  pepPartners: PepPartner[];
  documents: CompanyDocument[];
  onboardingError: boolean;
  limits: CompanyLimitRow[];
  limitsError: boolean;
  limitsUnavailableReason: string | null;
}

/** Raw backend payloads parsed defensively in `validate.ts`. */
export interface RawOnboardingDocument {
  id: string;
  type: string;
  fileName: string;
  fileSizeKb: number;
  uploadedAt: string;
}

export interface RawOnboardingStatus {
  kybStatus: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED" | "RESUBMIT";
  kybSubmittedAt: string | null;
  kybApprovedAt: string | null;
  kybRejectedReason: string | null;
  documents: RawOnboardingDocument[];
  missingDocuments: string[];
}

export interface RawUploadedDocumentResponse {
  documentId: string;
  type: string;
  fileName: string;
  fileSizeKb: number;
  uploadedAt: string | null;
}

export interface RawLimitModality {
  max: number | null;
  used: number | null;
  available: number | null;
}

export interface RawLimitCurrency {
  currency: string;
  fiatIn: RawLimitModality;
  fiatOut: RawLimitModality;
  chainIn: RawLimitModality;
  chainOut: RawLimitModality;
}

export interface RawLimitsResponse {
  avenia: {
    blocked: boolean;
    byCurrency: RawLimitCurrency[];
  } | null;
  aveniaReason: string | null;
}

export interface RawMeResponse {
  id: string;
  email: string;
  name: string | null;
  kycStatus: string;
  companyName: string | null;
  companyCnpj: string | null;
  companyCnae: string | null;
}

export interface RawBrandingResponse {
  companyDisplayName: string | null;
  companyLogoUrl: string | null;
}
