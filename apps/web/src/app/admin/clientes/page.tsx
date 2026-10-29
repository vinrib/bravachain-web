import { requireAdmin } from "@/lib/auth/require-admin";
import { ClientsList } from "@/components/admin/clients-list";

export default async function AdminClientsPage() {
  await requireAdmin("/admin/clientes");
  return <ClientsList />;
}
