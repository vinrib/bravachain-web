import { redirect } from "next/navigation";

/**
 * "Dados de conta" foi consolidada na tela única "Recebimentos" (contas no
 * exterior + chave PIX); a identidade da empresa migrou para Configurações ›
 * Perfil. Esta rota legada redireciona para Recebimentos.
 */
export default function DadosContaRedirect() {
  redirect("/recebimentos");
}
