"use client";

import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PixKeyCard } from "@/components/receive/pix-key-card";
import { CompanyIdentityCard } from "@/components/dados-conta/company-identity-card";

export default function DadosContaPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Dados de conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identidade da empresa e dados para receber do exterior.
        </p>
      </div>

      {/* Identidade da empresa */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-semibold text-foreground">Identidade da empresa</h2>
        <CompanyIdentityCard />
      </section>

      {/* Dados bancários para receber do exterior */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-semibold text-foreground">
          Dados bancários para receber do exterior
        </h2>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Landmark className="h-5 w-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                Veja os dados bancários e o passo a passo para receber pagamentos
                do exterior na conta dedicada da sua empresa.
              </p>
            </div>
            <Button asChild className="w-full shrink-0 gap-2 sm:w-auto">
              <Link href="/instrucoes-de-recebimento">
                Ver instruções de recebimento
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Chave PIX padrão */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-semibold text-foreground">Chave PIX padrão</h2>
        <PixKeyCard />
      </section>
    </div>
  );
}
