/**
 * KYC / KYB domain model.
 *
 * The cooperative (our end user) is normally a legal entity (PJ), so the KYB
 * flow is the common path. Avenia returns different verification links per
 * account type:
 *   - PF (individual):  a single `kycUrl`
 *   - PJ (company):     `basicCompanyDataUrl` (company data — filled by whoever
 *                       manages the co-op's records) AND
 *                       `authorizedRepresentativeUrl` (identity verification of
 *                       the legal representative — often a different person)
 *
 * We normalize the backend/Avenia status strings into a small union the UI can
 * switch on. The exact upstream strings must be reconciled against the backend
 * OpenAPI once available — see `normalizeKycStatus` for the mapping table.
 */

export type AccountType = "PF" | "PJ";

export type KycStatus =
  | "not_started" // no verification submitted yet
  | "pending" // link generated, applicant has not finished
  | "under_review" // submitted, provider/compliance analyzing ("em análise")
  | "approved" // verified — full platform access
  | "rejected"; // verification failed — needs action / resubmission

/** Terminal, actionable status buckets used across the return screen. */
export const isKycResolved = (status: KycStatus): boolean =>
  status === "approved" || status === "rejected";

/**
 * Links Avenia returns for a KYB (PJ) onboarding. Both may be sent to
 * different people, so the UI must present them as two distinct steps.
 */
export interface KybLinks {
  basicCompanyDataUrl: string;
  authorizedRepresentativeUrl: string;
}

/** Link Avenia returns for a KYC (PF) onboarding. */
export interface KycLinks {
  kycUrl: string;
}

/**
 * Maps an upstream status string to our normalized union.
 *
 * Reconciled with the backend Prisma `KycStatus` enum (PENDING_REVIEW,
 * APPROVED, REJECTED, KYB_APPROVED, KYB_REJECTED) and Avenia's `identityStatus`
 * (CONFIRMED). Everything downstream keys off the normalized union, so this is
 * the only place to edit.
 */
export function normalizeKycStatus(raw: string | null | undefined): KycStatus {
  switch ((raw ?? "").toUpperCase()) {
    case "APPROVED":
    case "KYB_APPROVED":
    case "COMPLETED":
    case "VERIFIED":
    case "CONFIRMED":
    case "ACTIVE":
      return "approved";
    case "REJECTED":
    case "KYB_REJECTED":
    case "FAILED":
    case "DENIED":
      return "rejected";
    // PENDING_REVIEW = submitted and awaiting compliance ("em análise").
    case "PENDING_REVIEW":
    case "UNDER_REVIEW":
    case "IN_REVIEW":
    case "REVIEWING":
    case "PROCESSING":
      return "under_review";
    case "PENDING":
    case "IN_PROGRESS":
    case "STARTED":
    case "WAITING":
      return "pending";
    case "NOT_SUBMITTED":
    case "":
      return "not_started";
    default:
      return "not_started";
  }
}
