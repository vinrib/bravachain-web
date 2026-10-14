"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { forgotPassword, ApiError } from "@/lib/client-api";
import { isValidEmail } from "@bravachain/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const RESEND_COOLDOWN_SECONDS = 30;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const submit = useCallback(async () => {
    setError(null);
    if (!isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email);
      // Uniform success regardless of whether the account exists.
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Muitas solicitações. Tente novamente em alguns minutos.");
      } else {
        setError("Não foi possível enviar as instruções. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, [email]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit();
  }

  const backToLogin = (
    <Link
      href="/login"
      className="text-sm font-medium text-primary hover:underline"
    >
      Voltar ao login
    </Link>
  );

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <svg
              className="h-6 w-6 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 7l9 6 9-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Verifique seu e-mail</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Se o e-mail estiver cadastrado, você receberá instruções para
              redefinir a senha. O link vale por 30 minutos.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Não recebeu? Verifique o spam ou tente novamente.
          </p>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="mt-4 w-full"
            disabled={loading || cooldown > 0}
            onClick={() => void submit()}
          >
            {loading ? (
              <Spinner size="sm" />
            ) : cooldown > 0 ? (
              `Reenviar em ${cooldown}s`
            ) : (
              "Reenviar instruções"
            )}
          </Button>
          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-sm">{backToLogin}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <span className="text-lg font-bold text-primary-foreground">B</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Esqueceu a senha?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe o e-mail da sua conta para receber as instruções de
            redefinição.
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
            placeholder="empresa@email.com"
            autoComplete="username"
          />

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Enviar instruções"}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm">{backToLogin}</p>
    </div>
  );
}
