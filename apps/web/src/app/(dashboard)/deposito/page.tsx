import { DepositFlow } from "@/components/deposit/deposit-flow";

export default function DepositoPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Depósito</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Adicione saldo em reais à sua conta via PIX.
        </p>
      </div>
      <DepositFlow />
    </div>
  );
}
