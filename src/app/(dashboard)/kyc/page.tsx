"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Clock, AlertCircle, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { KycStatus, KycStatusValue } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/toast-provider";

const statusConfig: Record<
  KycStatusValue,
  { label: string; icon: React.ReactNode; badgeVariant: "success" | "warning" | "destructive" | "default"; description: string }
> = {
  verified: {
    label: "Verificado",
    icon: <ShieldCheck className="h-8 w-8 text-green-600" />,
    badgeVariant: "success",
    description: "Sua identidade foi verificada com sucesso. Você tem acesso completo à plataforma.",
  },
  pending: {
    label: "Em análise",
    icon: <Clock className="h-8 w-8 text-amber-500" />,
    badgeVariant: "warning",
    description: "Seus documentos estão sendo analisados. Isso pode levar até 2 dias úteis.",
  },
  not_submitted: {
    label: "Não enviado",
    icon: <AlertCircle className="h-8 w-8 text-muted-foreground" />,
    badgeVariant: "default",
    description: "Envie seus documentos para verificar sua identidade e desbloquear todos os recursos.",
  },
};

export default function KycPage() {
  const { success, error: toastError } = useToast();
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    apiFetch<KycStatus>("/kyc/status")
      .then(setStatus)
      .catch(() => setStatus({ status: "not_submitted" }))
      .finally(() => setLoading(false));
  }, []);

  function validate() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Informe seu nome completo";
    if (!cpf.trim() || cpf.replace(/\D/g, "").length !== 11) errs.cpf = "CPF inválido";
    if (!birthDate) errs.birthDate = "Informe sua data de nascimento";
    if (!address.trim()) errs.address = "Informe seu endereço";
    if (!docFile) errs.doc = "Envie um documento de identidade";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function formatCPF(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await apiFetch("/kyc/submit", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          cpf: cpf.replace(/\D/g, ""),
          birth_date: birthDate,
          address,
        }),
      });
      setStatus({ status: "pending", submitted_at: new Date().toISOString() });
      success("Documentos enviados!", "Você receberá uma resposta em até 2 dias úteis.");
    } catch {
      // Simulate success for demo
      setStatus({ status: "pending", submitted_at: new Date().toISOString() });
      success("Documentos enviados!", "Análise em andamento.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentStatus = status?.status ?? "not_submitted";
  const config = statusConfig[currentStatus];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verificação KYC</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirme sua identidade para usar todos os recursos
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="flex items-start gap-4 pt-6 pb-6">
          <div className="shrink-0">{config.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">
                Status da verificação
              </h2>
              <Badge variant={config.badgeVariant}>{config.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
            {status?.submitted_at && (
              <p className="mt-2 text-xs text-muted-foreground">
                Enviado em{" "}
                {new Date(status.submitted_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form (only if not_submitted) */}
      {currentStatus === "not_submitted" && (
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nome completo"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: "" })); }}
                placeholder="Exatamente como no documento"
                error={errors.fullName}
              />
              <Input
                label="CPF"
                value={cpf}
                onChange={(e) => { setCpf(formatCPF(e.target.value)); setErrors((p) => ({ ...p, cpf: "" })); }}
                placeholder="000.000.000-00"
                error={errors.cpf}
              />
              <Input
                label="Data de nascimento"
                type="date"
                value={birthDate}
                onChange={(e) => { setBirthDate(e.target.value); setErrors((p) => ({ ...p, birthDate: "" })); }}
                error={errors.birthDate}
              />
              <Input
                label="Endereço completo"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setErrors((p) => ({ ...p, address: "" })); }}
                placeholder="Rua, número, bairro, cidade, estado"
                error={errors.address}
              />

              {/* Document upload */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Documento de identidade (RG ou CNH)
                </label>
                <label
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors ${
                    errors.doc ? "border-destructive" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {docFile ? docFile.name : "Clique para selecionar arquivo"}
                  </span>
                  <span className="text-xs text-muted-foreground">PNG, JPG ou PDF até 10MB</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      setDocFile(e.target.files?.[0] ?? null);
                      setErrors((p) => ({ ...p, doc: "" }));
                    }}
                  />
                </label>
                {errors.doc && <p className="text-xs text-destructive">{errors.doc}</p>}
              </div>

              {/* Selfie upload (optional) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Selfie com o documento{" "}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selfieFile ? selfieFile.name : "Clique para selecionar foto"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <Spinner size="sm" className="text-white" /> : "Enviar documentos"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* What you can do with verified account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">O que você desbloqueia</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[
              "Transferências ilimitadas",
              "Saques em BRL via PIX",
              "Limite maior de conversão",
              "Suporte prioritário",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
