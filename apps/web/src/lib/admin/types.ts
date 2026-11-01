/**
 * Types for the admin area, mirroring the backend compliance-review (#82/#83),
 * admin-users (#83 / PR C) and #92 (decision/limit removal) responses. Enum
 * values match the Prisma enums used by the API (ComplianceReviewStatus,
 * ComplianceRiskLevel, etc.). Bravachain does not approve, reject, or limit
 * clients or operations — only Avenia decides; this area is read-only plus
 * internal annotations.
 */

/**
 * `reviewStatus` is read-only/historical: since #92, nothing in the backend
 * ever sets it to IN_REVIEW/APPROVED/REJECTED again (the decision and the
 * reopen-on-change flow were removed). Existing values predate that change.
 */
export type ReviewStatus = "NOT_STARTED" | "IN_REVIEW" | "APPROVED" | "REJECTED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type KybStatus = string; // free-form on the backend; shown as a labeled chip
export type UserRole = "USER" | "ADMIN";

/** A row in the "clients in review" listing. */
export interface ClientListItem {
  userId: string;
  companyName: string | null;
  companyCnpj: string | null;
  kybStatus: KybStatus | null;
  reviewStatus: ReviewStatus;
  riskLevel: RiskLevel | null;
  isPep: boolean;
  updatedAt: string | null;
}

export interface ClientListResponse {
  items: ClientListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Review {
  status: ReviewStatus;
  riskLevel: RiskLevel | null;
  riskRationale: string | null;
  isPep: boolean;
  pepNotes: string | null;
  sourceOfFundsNotes: string | null;
  projectedMonthlyVolumeBrl: number | string | null;
  publicFundsInvolved: boolean | null;
  reviewedAt: string | null;
  nextReviewAt: string | null;
}

export interface Owner {
  id: string;
  fullName: string;
  /**
   * Server-masked CPF (e.g. "•••.456.•••-07"). The full CPF is never in the
   * detail response — it comes only from the audited reveal route, in memory.
   */
  cpfMasked: string;
  /** Whether the reveal route is available for this owner. */
  cpfRevealable: boolean;
  ownershipPercent: number | string | null;
  role: string | null;
  isPep: boolean;
  pepRole: string | null;
  pepEndedAt: string | null;
  relatedToPep: boolean;
  notes: string | null;
}

export interface KybDocument {
  id: string;
  type: string;
  fileName: string | null;
  fileSizeKb: number | null;
  uploadedAt: string | null;
}

/** Company / KYB profile shown in the review header and "Dados da empresa". */
export interface Company {
  name: string | null;
  cnpj: string | null;
  openingDate: string | null;
  cnae: string | null;
  estimatedRevenue: number | string | null;
  mainBuyerCountry: string | null;
  kybStatus: KybStatus | null;
  kybSubmittedAt: string | null;
}

export interface ClientDetail {
  userId: string;
  accountType: string | null;
  kybStatus: KybStatus | null;
  company: Company | null;
  review: Review | null;
  owners: Owner[];
  documents: KybDocument[];
}

/** Payload for creating/updating a beneficial owner (POST / PATCH owners). */
export interface OwnerPayload {
  fullName: string;
  /** Digits only (11). Omitted on edit unless the reviewer typed a new one. */
  cpf?: string;
  ownershipPercent?: number;
  role?: string | null;
  isPep: boolean;
  pepRole?: string | null;
  pepEndedAt?: string | null;
  relatedToPep: boolean;
  notes?: string | null;
  /** Mandatory on remove and when an edit toggles `isPep`. */
  reason?: string;
}

/** The admin's own MFA status (GET /v1/auth/mfa/status). */
export interface MfaStatus {
  enabled: boolean;
  enabledAt: string | null;
  recoveryCodesRemaining: number | null;
}

/** Total recovery codes issued per enrollment (backend constant). */
export const MFA_RECOVERY_CODES_TOTAL = 8;
/** At or below this many remaining codes, nudge the admin to regenerate. */
export const MFA_RECOVERY_CODES_LOW = 3;

/** Payload for PUT /review (all optional — the reviewer fills incrementally). */
export interface UpsertReviewPayload {
  riskLevel?: RiskLevel | null;
  riskRationale?: string;
  isPep?: boolean;
  pepNotes?: string;
  sourceOfFundsNotes?: string;
  projectedMonthlyVolumeBrl?: number;
  publicFundsInvolved?: boolean;
}

export interface AdminUser {
  userId: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  mfaEnabled: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
}

export interface UserSearchResult {
  userId: string;
  name: string | null;
  email: string | null;
  role: UserRole;
}
