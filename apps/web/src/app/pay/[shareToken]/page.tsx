import type { Metadata } from "next";
import { PublicPay } from "@/components/receive/public-pay";
import { getPublicInstructions } from "@/lib/receive/server";

export const metadata: Metadata = {
  title: "Instruções de pagamento · Bravachain",
  // Token link — keep it out of search indexes.
  robots: { index: false, follow: false },
};

export default async function PayPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const result = await getPublicInstructions(shareToken);
  return <PublicPay result={result} shareToken={shareToken} />;
}
