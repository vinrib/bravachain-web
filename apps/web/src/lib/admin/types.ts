/**
 * Types for the admin area, mirroring the backend compliance-review (#82/#83)
 * and admin-users (#83 / PR C) responses. Enum values match the Prisma enums
 * used by the API (ComplianceReviewStatus, ComplianceRiskLevel, etc.).
 */

export type ReviewStatus = "NOT_STARTED" | "IN_REVIEW" | "APPROVED" | "REJECTED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type Decision = "APPROVE" | "REJECT";
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
  complianceGrandfathered: boolean;
  approvals: { approved: number; required: number | null };
  updatedAt: string | null;
}

export interface ClientListResponse {
  items: ClientListItem[];
  page: number;
  pageSize: number;
  total: number;
}

/** The money-movement gate preview ("Efeito no acesso do cliente"). */
export type GateDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "IDENTITY_PENDING"
        | "KYB_PENDING"
        | "USER_NOT_FOUND"
        | "COMPLIANCE_REVIEW_PENDING"
        | string;
      accountType?: string;
      identityStatus?: string;
      kybStatus?: string;
      complianceReviewStatus?: string;
    };

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

export interface Approval {
  approverUserId: string;
  decision: Decision;
  note: string | null;
  createdAt: string | null;
}

export interface Owner {
  id: string;
  fullName: string;
  /** Full CPF — returned only to admins; masked in the UI until revealed. */
  cpf: string;
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

export interface ClientDetail {
  userId: string;
  accountType: string | null;
  kybStatus: KybStatus | null;
  complianceGrandfathered: boolean;
  simulatedGateDecision: GateDecision | null;
  review: Review | null;
  approvals: Approval[];
  owners: Owner[];
  documents: KybDocument[];
}

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
