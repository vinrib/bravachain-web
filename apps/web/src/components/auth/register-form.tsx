"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, ApiError } from "@/lib/client-api";
import { isValidEmail, isValidCNPJ, formatCNPJ, onlyDigits } from "@bravachain/shared";
import { KYB_LINKS_STORAGE_KEY } from "@/lib/kyb-handoff";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function RegisterForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!companyName.trim()) next.companyName = "Informe a razão social.";
    if (!isValidCNPJ(cnpj)) next.cnpj = "CNPJ inválido.";
    if (!isValidEmail(email)) next.email = "E-mail inválido.";
    if (password.length < 8) next.password = "Mínimo de 8 caracteres.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      // Cooperative = pessoa jurídica → accountType COMPANY. The backend starts
      // the Avenia KYB during signup and returns the verification links.
      const res = await signup({
        name: companyName,
        documentNumber: onlyDigits(cnpj),
        accountType: "COMPANY",
        email,
        password,
      });
      // Hand the returned Avenia links to the verification screen.
      const data = (res.data ?? {}) as Record<string, unknown>;
      const links = {
        basicCompanyDataUrl: data.basicCompanyDataUrl ?? null,
        authorizedRepresentativeUrl: data.authorizedRepresentativeUrl ?? null,
        kycUrl: data.kycUrl ?? null,
      };
      if (links.basicCompanyDataUrl || links.authorizedRepresentativeUrl || links.kycUrl) {
        sessionStorage.setItem(KYB_LINKS_STORAGE_KEY, JSON.stringify(links));
      }
      router.replace("/cadastro");
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Não foi possível criar a conta.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <span className="text-lg font-bold text-primary-foreground">B</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Cadastrar cooperativa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Depois do cadastro você concluirá a verificação (KYB)
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Razão social"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Cooperativa Agroextrativista..."
            error={errors.companyName}
            autoComplete="organization"
          />
          <Input
            label="CNPJ"
            value={cnpj}
            onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            error={errors.cnpj}
          />
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cooperativa@email.com"
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            error={errors.password}
            autoComplete="new-password"
          />

          {formError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{formError}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Criar conta"}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Já tem cadastro?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
