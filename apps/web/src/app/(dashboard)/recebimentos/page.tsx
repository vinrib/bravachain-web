import { redirect } from "next/navigation";

/**
 * "Recebimentos" foi removido do menu; o recebimento acontece via a tela de
 * Instruções de recebimento. Esta rota legada redireciona para lá. (Gated pelo
 * mesmo flag NEXT_PUBLIC_FEATURE_RECEBIMENTOS via layout.tsx, igual ao destino.)
 */
export default function RecebimentosRedirect() {
  redirect("/instrucoes-de-recebimento");
}
