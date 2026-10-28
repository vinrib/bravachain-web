import { requireAdminEnrolled } from "@/lib/auth/require-admin";
import { AdminOverview } from "@/components/admin/admin-overview";

export default async function AdminPage() {
  await requireAdminEnrolled("/admin");
  return <AdminOverview />;
}
