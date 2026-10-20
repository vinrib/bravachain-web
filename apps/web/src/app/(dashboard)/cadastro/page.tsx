import { redirect } from "next/navigation";

/** Legacy route — verification now lives under /configuracoes/verificacao. */
export default function CadastroRedirect() {
  redirect("/configuracoes/verificacao");
}
