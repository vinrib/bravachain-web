import { ReceiveDetail } from "@/components/receive/receive-detail";

export default async function ReceiveDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <ReceiveDetail ticketId={ticketId} />;
}
