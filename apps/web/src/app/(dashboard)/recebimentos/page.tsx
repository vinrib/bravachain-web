"use client";

import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useKycState } from "@/lib/hooks";
import { PixKeyCard } from "@/components/receive/pix-key-card";
import { CreateReceiveForm } from "@/components/receive/create-receive-form";
import { RecentReceives } from "@/components/receive/recent-receives";

export default function RecebimentosPage() {
  const kyc = useKycState();
  const kybApproved = kyc.data?.status === "approved";
  const kybResolved = Boolean(kyc.data);

  // KYB gate: receivings require approved verification (same as withdrawals).
  if (kybResolved && !kybApproved) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <ShieldAlert className="h-10 w-10 text-amber-500" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Verificação necessária
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Para receber do exterior, a empresa precisa concluir a verificação (KYB).
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/cadastro">
                Concluir verificação
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recebimentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gere instruções de pagamento para receber do exterior
        </p>
      </div>

      <PixKeyCard />
      <CreateReceiveForm />
      <RecentReceives />
    </div>
  );
}
