import { requireAdmin } from "@/lib/auth/require-admin";
import { ClientReview } from "@/components/admin/client-review";

export default async function AdminClientReviewPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  await requireAdmin(`/admin/clientes/${userId}`);
  return <ClientReview userId={userId} />;
}
