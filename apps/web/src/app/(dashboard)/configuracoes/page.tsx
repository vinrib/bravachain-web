"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight, Languages, LogOut, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { logout } from "@/lib/client-api";

const SECTIONS = [
  {
    href: "/configuracoes/verificacao",
    label: "Verificação",
    description: "Status do KYB e documentos da empresa",
    icon: ShieldCheck,
  },
  {
    href: "/configuracoes/perfil",
    label: "Perfil",
    description: "Identidade da empresa (nome público e logo)",
    icon: Building2,
  },
  {
    href: "/configuracoes/preferencias",
    label: "Preferências",
    description: "Idioma",
    icon: Languages,
  },
] as const;

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie a verificação, os dados da conta e suas preferências.
        </p>
      </div>

      <Card className="divide-y divide-border overflow-hidden">
        {SECTIONS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </Card>

      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2"
        onClick={handleLogout}
        disabled={signingOut}
      >
        {signingOut ? <Spinner size="sm" /> : <LogOut className="h-4 w-4" />}
        Encerrar sessão
      </Button>
    </div>
  );
}
