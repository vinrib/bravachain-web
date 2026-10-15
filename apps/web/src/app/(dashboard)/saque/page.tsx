"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Clock } from "lucide-react";
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
import { mapWithdrawError } from "@/lib/withdraw-errors";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { AmountInput } from "@/components/ui/amount-input";
import { InfoAlert } from "@/components/ui/info-alert";
import { WithdrawHistory } from "@/components/dashboard/withdraw-history";
import { useToast } from "@/components/toast-provider";
import { PIX_RETURN_WARNING_FULL, PIX_RETURN_WARNING_SHORT } from "@/lib/pix-warning";

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

  // Prefill the amount from a ?valor= query (e.g. the Início "Saque rápido"
  // card). Read once on mount; no money moves without the user submitting here.
  const [amountInput, setAmountInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("valor") ?? "";
  });
  const [pixKey, setPixKey] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [holdMessage, setHoldMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const amount = useMemo(() => parseBRL(amountInput), [amountInput]);
  const pixKeyType = useMemo(() => detectPixKeyType(pixKey), [pixKey]);
  const available = balance.data?.available ?? 0;

  const kybApproved = kyc.data?.status === "approved";
  const kybResolved = Boolean(kyc.data);

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
    setHoldMessage(null);
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
        `${formatMoney(amount)} a caminho via PIX. ${PIX_RETURN_WARNING_SHORT}`,
      );
      router.push("/extrato");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const view = mapWithdrawError(err.code, err.message);
        if (view.hold) {
          setHoldMessage(view.message);
          setErrors({});
        } else if (view.field) {
          setErrors({ [view.field]: view.message });
        } else {
          setErrors({ form: view.message });
        }
      } else {
        setErrors({ form: "Não foi possível solicitar o saque." });
      }
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
            <ShieldAlert className="h-10 w-10 text-[#c77a18]" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Verificação necessária
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Para sacar via PIX, a sua empresa precisa concluir a verificação (KYB).
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">Saques via PIX</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pague contas no Brasil a partir do saldo em reais da sua empresa.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Form column */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Valor */}
              <div>
                <label className="text-[13.5px] font-semibold text-foreground">Valor</label>
                <AmountInput
                  value={amountInput}
                  onChange={(v) => {
                    setAmountInput(v);
                    setErrors((p) => ({ ...p, amount: "" }));
                  }}
                  error={errors.amount}
                  className="mt-1.5"
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Disponível{" "}
                    <span className="font-medium text-foreground tabular-nums">
                      {balance.loading
                        ? "…"
                        : formatMoney(available, {
                            currency: balance.data?.currency ?? "BRL",
                          })}
                    </span>
                  </span>
                  {available > 0 && (
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => setAmountInput(available.toFixed(2).replace(".", ","))}
                    >
                      Usar saldo total
                    </button>
                  )}
                </div>
              </div>

              {/* Chave PIX de destino */}
              <Input
                label="Chave PIX de destino"
                value={pixKey}
                onChange={(e) => {
                  setPixKey(e.target.value);
                  setErrors((p) => ({ ...p, pixKey: "" }));
                  setHoldMessage(null);
                }}
                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                error={errors.pixKey}
                suffix={
                  pixKeyType ? (
                    <Badge variant="primary">{PIX_KEY_LABELS[pixKeyType]}</Badge>
                  ) : undefined
                }
              />

              {holdMessage && (
                <div className="flex items-start gap-2 rounded-lg bg-[#c77a18]/10 px-3 py-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#c77a18]" />
                  <p className="text-sm text-[#8a5310] dark:text-[#d79a3a]">{holdMessage}</p>
                </div>
              )}

              {errors.form && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2">
                  <p className="text-sm text-destructive">{errors.form}</p>
                </div>
              )}

              <InfoAlert>{PIX_RETURN_WARNING_FULL}</InfoAlert>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting || balance.loading}
              >
                {submitting ? <Spinner size="sm" /> : "Solicitar saque"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History column */}
        <aside>
          <WithdrawHistory />
        </aside>
      </div>
    </div>
  );
}
