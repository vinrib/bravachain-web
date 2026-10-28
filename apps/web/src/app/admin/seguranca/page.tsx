import { requireAdminEnrolled } from "@/lib/auth/require-admin";
import { AdminSecurity } from "@/components/admin/admin-security";

export default async function AdminSecurityPage() {
  await requireAdminEnrolled("/admin/seguranca");
  return <AdminSecurity />;
}
