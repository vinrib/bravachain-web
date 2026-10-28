import { requireAdminEnrolled } from "@/lib/auth/require-admin";
import { AdminConstruction } from "@/components/admin/admin-construction";

export default async function AdminClientsPage() {
  await requireAdminEnrolled("/admin/clientes");
  return <AdminConstruction section="clients" />;
}
