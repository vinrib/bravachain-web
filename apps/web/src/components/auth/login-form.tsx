"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, ApiError } from "@/lib/client-api";
import { isValidEmail } from "@bravachain/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <span className="text-lg font-bold text-primary-foreground">B</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Entrar na Bravachain</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse o painel da sua cooperativa
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="cooperativa@email.com"
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Entrar"}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Ainda não tem cadastro?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Cadastrar cooperativa
        </Link>
      </p>
    </div>
  );
}
