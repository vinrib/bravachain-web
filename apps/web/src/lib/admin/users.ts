/**
 * Client-side calls for admin-user management (list, search, role change, MFA
 * reset) via the authenticated BFF proxy. The role-change route returns 404 when
 * ADMIN_ROLE_MANAGEMENT_ENABLED is off — callers detect that (ApiError.status)
 * and show the "role management disabled" banner instead of a generic error.
 */
import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import type {
  AdminUser,
  AdminUserListResponse,
  UserRole,
  UserSearchResult,
} from "./types";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
function intOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function normalizeAdminUser(raw: unknown): AdminUser {
  const r = asRecord(raw);
  return {
    userId: str(r.userId) ?? "",
    name: str(r.name),
    email: str(r.email),
    role: (str(r.role) as UserRole) ?? "USER",
    mfaEnabled: r.mfaEnabled === true,
    createdAt: str(r.createdAt),
    lastLoginAt: str(r.lastLoginAt),
  };
}

export async function listAdmins(
  page = 1,
  pageSize = 50,
): Promise<AdminUserListResponse> {
  const qs = new URLSearchParams({
    role: "ADMIN",
    page: String(page),
    pageSize: String(pageSize),
  });
  const body = await apiFetch<unknown>(`${endpoints.admin.users}?${qs.toString()}`);
  const r = asRecord(body);
  const items = Array.isArray(r.items) ? r.items.map(normalizeAdminUser) : [];
  return {
    items,
    page: intOr(r.page, 1),
    pageSize: intOr(r.pageSize, items.length),
    total: intOr(r.total, items.length),
  };
}

export async function searchUsers(email: string): Promise<UserSearchResult[]> {
  const qs = new URLSearchParams({ email });
  const body = await apiFetch<unknown>(`${endpoints.admin.usersSearch}?${qs.toString()}`);
  const r = asRecord(body);
  return Array.isArray(r.items)
    ? r.items.map((u) => {
        const ur = asRecord(u);
        return {
          userId: str(ur.userId) ?? "",
          name: str(ur.name),
          email: str(ur.email),
          role: (str(ur.role) as UserRole) ?? "USER",
        };
      })
    : [];
}

export async function changeRole(
  userId: string,
  role: UserRole,
  reason: string,
): Promise<void> {
  await apiFetch<unknown>(endpoints.admin.userRole(userId), {
    method: "POST",
    body: JSON.stringify({ role, reason }),
  });
}

export async function resetUserMfa(userId: string, reason: string): Promise<void> {
  await apiFetch<unknown>(endpoints.admin.userMfaReset(userId), {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
