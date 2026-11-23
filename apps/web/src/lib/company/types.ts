import type { BackendKybDocumentType, CompanyLimitScope } from "./constants";

export type AveniaStatusKind = "approved" | "in_analysis" | "pending";

export interface CompanyProfile {
  legalName: string;
  entityType: string;
  cnpj: string;
  email: string;
  phone: string;
  cnae: string;
  address: string;
  aveniaStatusKind: AveniaStatusKind;
  aveniaStatusLabel: string;
  /** True when at least one cadastral field came from the typed fallback adapter. */
  usesFallbackFields: boolean;
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

export type CompanyDocumentStatus =
  | "Aprovado pela Avenia"
  | "Enviado — em análise pela Avenia"
  | "Pendente de envio";

export interface CompanyDocument {
  id: string;
  /** Present when backed by `POST /v1/onboarding/documents/:type`. */
  apiType: BackendKybDocumentType | null;
  name: string;
  category: string;
  fileName: string | null;
  /** Formatted display date (America/Sao_Paulo) or null when awaiting upload. */
  uploadedAtLabel: string | null;
  status: CompanyDocumentStatus;
}

export interface CompanyLimitValue {
  used: number | null;
  max: number | null;
  unit: string;
}

export interface CompanyLimitRow {
  id: string;
  scope: CompanyLimitScope;
  label: string;
  isGlobal: boolean;
  entry: CompanyLimitValue;
  exit: CompanyLimitValue;
}

export interface CompanyBundle {
  profile: CompanyProfile;
  pepPartners: PepPartner[];
  documents: CompanyDocument[];
  limits: CompanyLimitRow[];
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
}

export interface RawBrandingResponse {
  companyDisplayName: string | null;
  companyLogoUrl: string | null;
}
