"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { resetPassword, ApiError } from "@/lib/client-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PasswordToggle } from "@/components/auth/password-toggle";

const MIN_LENGTH = 8;

type View = "loading" | "form" | "success" | "invalid";

// Module-scoped, memory-only cache for the reset token. Stripping the token
// from the URL via history.replaceState makes Next's App Router remount this
// component; the remounted instance reads the already-stripped URL and would
// otherwise see no token. A component ref can't survive that remount, so the
// captured token is kept here (never in the DOM, URL, or storage) for the
// lifetime of the page load.
let cachedToken: string | null = null;

/**
 * Returns the reset token, reading it from the URL when present and stripping
 * it immediately, or falling back to the value captured earlier this page load
 * (after a strip-triggered remount). A token actually present in the URL always
 * wins, so a freshly opened link is picked up correctly.
 */
function readAndStripToken(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get("token");
  if (fromUrl) {
    cachedToken = fromUrl;
    window.history.replaceState(null, "", window.location.pathname);
    return fromUrl;
  }
  return cachedToken;
}

export function ResetPasswordForm() {
  // The reset token lives only in memory. It is never rendered into the DOM,
  // logged, or put back into the URL.
  const tokenRef = useRef<string | null>(null);
  const [view, setView] = useState<View>("loading");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only surface the confirm-mismatch hint once the user has engaged with it.
  const [confirmTouched, setConfirmTouched] = useState(false);

  // On mount, resolve the token (from the URL, or the memory cache after a
  // strip-triggered remount). Strips it from the address bar so it can't leak
  // via the URL, history, bookmarks, or a Referer header.
  useEffect(() => {
    const token = readAndStripToken();
    tokenRef.current = token;
    // Safe: setState runs at most once per mount with a stable value.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setView(token ? "form" : "invalid");
  }, []);

  const meetsLength = password.length >= MIN_LENGTH;
  const matches = confirm.length > 0 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!meetsLength) {
      setError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setConfirmTouched(true);
      setError("As senhas não coincidem.");
      return;
    }
    const token = tokenRef.current;
    if (!token) {
      setView("invalid");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setView("success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Muitas tentativas. Tente novamente em alguns minutos.");
      } else {
        // 400/401 (and anything else) → the link is no longer usable.
        setView("invalid");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "loading") {
    return (
      <div className="flex w-full max-w-sm items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (view === "success") {
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
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">
              Senha redefinida com sucesso
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Por segurança, saímos da sua conta em todos os dispositivos. Entre
              novamente com a nova senha.
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  if (view === "invalid") {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
            <svg
              className="h-6 w-6 text-destructive"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 8v5M12 16h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">
              Link inválido ou expirado
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Solicite um novo link para redefinir sua senha. Cada link vale por
              30 minutos.
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/forgot-password">Solicitar novo link</Link>
        </Button>
        <p className="mt-5 text-center text-sm">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    );
  }

  // view === "form"
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <span className="text-lg font-bold text-primary-foreground">B</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Crie uma nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use uma senha que você não utilize em outros serviços.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Hidden username field so password managers associate the new
              credential with the account. No value is known here. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            aria-hidden="true"
            tabIndex={-1}
            className="hidden"
          />

          <div>
            <Input
              label="Nova senha"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              suffix={
                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              }
            />
            <p
              className={`mt-1.5 flex items-center gap-1.5 text-xs ${
                password.length === 0
                  ? "text-muted-foreground"
                  : meetsLength
                    ? "text-success"
                    : "text-destructive"
              }`}
            >
              <span aria-hidden="true">{meetsLength ? "✓" : "•"}</span>
              Mínimo de 8 caracteres
            </p>
          </div>

          <Input
            label="Confirmar nova senha"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            required
            placeholder="••••••••"
            autoComplete="new-password"
            error={
              confirmTouched && confirm.length > 0 && !matches
                ? "As senhas não coincidem."
                : undefined
            }
          />
          {matches && (
            <p className="-mt-2 text-xs text-success">As senhas coincidem</p>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full"
            disabled={submitting || !meetsLength || !matches}
          >
            {submitting ? <Spinner size="sm" /> : "Redefinir senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
