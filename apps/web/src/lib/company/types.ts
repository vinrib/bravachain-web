import type { BackendKybDocumentType, CompanyLimitScope } from "./constants";

export type AveniaStatusKind =
  | "approved"
  | "in_analysis"
  | "pending"
  | "unavailable";

export interface CompanyProfile {
  /** Company name reported during onboarding (`GET /v1/onboarding/company`); null when absent (hidden). */
  legalName: string | null;
  /** Formatted CNPJ from `GET /v1/onboarding/company` digits; null when absent (hidden). */
  cnpj: string | null;
  /** CNAE from `GET /v1/onboarding/company`; null when absent (hidden). */
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
  /** Exact decimal string from backend (e.g. `"43.00"`, `"150.00"`), or null. Frontend NEVER computes this. */
  usedPct: string | null;
  unit: string;
}

export interface CompanyLimitRow {
  id: string;
  scope: CompanyLimitScope | string;
  label: string;
  isGlobal: boolean;
  period: "monthly" | null;
  /** Reference month in `YYYY-MM` format, or null. */
  referenceMonth: string | null;
  /** `false` => currency not enabled yet; `true` => enabled; `null` => unknown (render normal row without claim). */
  unlocked: boolean | null;
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
  /** True when `GET /v1/limits` returns HTTP 403 (onboarding not yet approved by Avenia). */
  limitsForbidden: boolean;
  limitsUnavailableReason: string | null;
}

/** Strict 3-key payload returned by `GET /v1/onboarding/company`. */
export interface RawOnboardingCompany {
  legalName: string | null;
  cnpj: string | null;
  cnae: string | null;
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
  usedPct: string | null;
}

export interface RawLimitCurrency {
  currency: string;
  period: "monthly" | null;
  referenceMonth: string | null;
  unlocked: boolean | null;
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
