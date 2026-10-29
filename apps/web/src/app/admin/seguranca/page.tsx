import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminsSecurity } from "@/components/admin/admins-security";

export default async function AdminSecurityPage() {
  await requireAdmin("/admin/seguranca");
  return <AdminsSecurity />;
}
