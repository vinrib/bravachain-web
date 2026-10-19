import { redirect } from "next/navigation";

/**
 * "Instruções de recebimento" foi consolidada na tela única "Recebimentos".
 * Esta rota legada redireciona para lá (o destino aplica o feature flag).
 */
export default function InstrucoesRedirect() {
  redirect("/recebimentos");
}
