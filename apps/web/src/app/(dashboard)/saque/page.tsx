"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Banknote, ShieldAlert, ArrowRight } from "lucide-react";
import {
  parseBRL,
  formatMoney,
  detectPixKeyType,
  normalizePixKey,
  toBackendPixKeyType,
} from "@bravachain/shared";
import { endpoints } from "@bravachain/api-client";
import { apiFetch, ApiError } from "@/lib/client-api";
import { useBalance, useKycState } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/toast-provider";

const PIX_KEY_LABELS: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  phone: "Telefone",
  evp: "Chave aleatória",
};

export default function SaquePage() {
  const router = useRouter();
  const { success } = useToast();
  const balance = useBalance();
  const kyc = useKycState();

  const [amountInput, setAmountInput] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const amount = useMemo(() => parseBRL(amountInput), [amountInput]);
  const pixKeyType = useMemo(() => detectPixKeyType(pixKey), [pixKey]);
  const available = balance.data?.available ?? 0;

  const kybApproved = kyc.data?.status === "approved";
  const kybResolved = Boolean(kyc.data); // finished loading kyc

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (amount === null || amount <= 0) {
      next.amount = "Informe um valor válido.";
    } else if (amount > available) {
      next.amount = "Valor maior que o saldo disponível.";
    }
    if (!pixKeyType) next.pixKey = "Chave PIX inválida.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || amount === null || !pixKeyType) return;
    setSubmitting(true);
    try {
      await apiFetch(endpoints.withdrawals.createPix, {
        method: "POST",
        body: JSON.stringify({
          amountBrla: amount,
          pixKey: normalizePixKey(pixKey),
          pixKeyType: toBackendPixKeyType(pixKeyType),
        }),
      });
      success(
        "Saque solicitado!",
        `${formatMoney(amount)} a caminho via PIX.`,
      );
      router.push("/extrato");
      router.refresh();
    } catch (err) {
      setErrors({
        form: err instanceof ApiError ? err.message : "Não foi possível solicitar o saque.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // KYB gate: saques exigem verificação aprovada.
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
                Para sacar via PIX, a cooperativa precisa concluir a verificação (KYB).
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
        <h1 className="text-2xl font-bold text-foreground">Saque via PIX</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Transfira o saldo da cooperativa para uma chave PIX
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Saldo disponível</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {balance.loading ? "…" : formatMoney(available, { currency: balance.data?.currency ?? "BRL" })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados do saque</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Input
                label="Valor"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setErrors((p) => ({ ...p, amount: "" }));
                }}
                inputMode="decimal"
                placeholder="0,00"
                prefix="R$"
                error={errors.amount}
              />
              {available > 0 && (
                <button
                  type="button"
                  className="mt-1.5 text-xs font-medium text-primary hover:underline"
                  onClick={() => setAmountInput(available.toFixed(2).replace(".", ","))}
                >
                  Usar saldo total
                </button>
              )}
            </div>

            <div>
              <Input
                label="Chave PIX de destino"
                value={pixKey}
                onChange={(e) => {
                  setPixKey(e.target.value);
                  setErrors((p) => ({ ...p, pixKey: "" }));
                }}
                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                error={errors.pixKey}
                suffix={
                  pixKeyType ? (
                    <Badge variant="primary">{PIX_KEY_LABELS[pixKeyType]}</Badge>
                  ) : undefined
                }
              />
            </div>

            {errors.form && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2">
                <p className="text-sm text-destructive">{errors.form}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={submitting || balance.loading}
            >
              {submitting ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Banknote className="h-4 w-4" />
                  Solicitar saque
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
