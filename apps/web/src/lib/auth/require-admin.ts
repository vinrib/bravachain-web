import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { MFA_ENROLLMENT_REQUIRED } from "@bravachain/api-client";
import { getAccessToken, clearSession } from "./session";
import { backendMe } from "./backend";
import { MFA_ENROLLMENT_PATH } from "@/lib/mfa/routes";

/**
 * Server-side gate for the admin area.
 *
 * Admin-ness is decided by the backend `/auth/me` role. Because MFA enforcement
 * (`MFA_ADMIN_ENFORCED`) targets admins, a 403 `MFA_ENROLLMENT_REQUIRED` from
 * `/auth/me` is itself proof the account is an admin that simply hasn't enrolled
 * yet — we let those through so they can reach the activation wizard.
 *
 * The role is read defensively (role string / roles array / isAdmin) because the
 * real `/auth/me` schema could not be inspected against the live OpenAPI.
 */

export interface AdminContext {
  /** True when the account is an admin (enrolled, or admin-under-enforcement). */
  isAdmin: boolean;
  /** True when the admin must activate MFA before using the rest of the area. */
  enrollmentRequired: boolean;
  /** Raw `/auth/me` body when available (never contains tokens). */
  user: unknown;
}

function isAdminRole(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  const source =
    (record.user as Record<string, unknown> | undefined) ??
    (record.data as Record<string, unknown> | undefined) ??
    record;

  if (source.isAdmin === true) return true;
  const role = source.role;
  if (typeof role === "string" && role.toUpperCase() === "ADMIN") return true;
  const roles = source.roles;
  if (Array.isArray(roles)) {
    return roles.some((r) => typeof r === "string" && r.toUpperCase() === "ADMIN");
  }
  return false;
}

/**
 * Loads the admin context once per request (memoized), or `null` when there is
 * no session at all. Shared by the layout and the pages so `/auth/me` is hit
 * only once even though several server components gate on it.
 */
export const loadAdminContext = cache(async (): Promise<AdminContext | null> => {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const { ok, status, body } = await backendMe(accessToken);

  if (ok) {
    return { isAdmin: isAdminRole(body), enrollmentRequired: false, user: body };
  }

  const code = (body as { code?: string } | null)?.code;
  if (status === 403 && code === MFA_ENROLLMENT_REQUIRED) {
    // Admin under enforcement who hasn't enrolled yet.
    return { isAdmin: true, enrollmentRequired: true, user: null };
  }

  if (status === 401) {
    await clearSession();
  }
  return { isAdmin: false, enrollmentRequired: false, user: null };
});

/**
 * Gates the admin area. Redirects anonymous users to login and non-admins to
 * the dashboard. Admins (including those who still need to enroll) pass through.
 */
export async function requireAdmin(nextPath = "/admin"): Promise<AdminContext> {
  const ctx = await loadAdminContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!ctx.isAdmin) redirect("/");
  return ctx;
}

/**
 * For admin pages other than the wizard: ensures the admin has finished MFA
 * enrollment, redirecting to the activation wizard when enforcement requires it.
 */
export async function requireAdminEnrolled(nextPath = "/admin"): Promise<AdminContext> {
  const ctx = await requireAdmin(nextPath);
  if (ctx.enrollmentRequired) redirect(`${MFA_ENROLLMENT_PATH}?required=1`);
  return ctx;
}
