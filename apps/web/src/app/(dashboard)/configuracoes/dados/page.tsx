import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompanyIdentityCard } from "@/components/dados-conta/company-identity-card";
import { PixKeyCard } from "@/components/receive/pix-key-card";

export default function ConfiguracoesDadosPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Configurações
        </Link>
        <h1 className="mt-2 font-serif text-[30px] font-bold text-foreground">Dados da conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identidade da empresa e chave PIX de recebimento.
        </p>
      </div>

      <CompanyIdentityCard />
      <PixKeyCard />
    </div>
  );
}
