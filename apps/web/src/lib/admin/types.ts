/**
 * Types for the admin area, mirroring the backend admin-users (#83 / PR C)
 * responses. Bravachain does not approve, reject, or limit clients or
 * operations — only Avenia decides; this area is access/security control only
 * (admins, roles, MFA), never a client or operation decision.
 */

export type UserRole = "USER" | "ADMIN";

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
