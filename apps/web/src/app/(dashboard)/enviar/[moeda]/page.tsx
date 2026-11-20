import { notFound } from "next/navigation";
import { SendFlow } from "@/components/send/send-flow";
import { currencyFromSlug } from "@/lib/send/types";

/**
 * Per-currency send flow. The slug (brl|usd|eur) maps to a currency; anything
 * else 404s. The whole /enviar tree is already gated by the Enviar flag in the
 * parent layout.
 */
export default async function EnviarMoedaPage({
  params,
}: {
  params: Promise<{ moeda: string }>;
}) {
  const { moeda } = await params;
  const currency = currencyFromSlug(moeda);
  if (!currency) notFound();
  return <SendFlow currency={currency} />;
}
