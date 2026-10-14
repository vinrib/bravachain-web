"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, ApiError } from "@/lib/client-api";
import { isValidEmail } from "@bravachain/shared";

const FIELD =
  "h-[50px] w-full rounded-[12px] border border-[#d9d5ca] bg-white px-[15px] text-[15px] text-[#011a0f] outline-none placeholder:text-[#9aa09a] focus:border-[#011a0f] focus:ring-2 focus:ring-[#0b6b4f]/40";
const LABEL = "text-[13.5px] font-semibold text-[#011a0f]";

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
      {off && <path d="M4 20 20 4" />}
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      await login({ email, password, rememberMe });
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? "Muitas tentativas. Tente novamente em alguns minutos."
          : "E-mail ou senha incorretos.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex w-full max-w-[380px] flex-col gap-[22px]">
      <h1 className="font-serif text-[28px] font-bold leading-[1.25] text-[#011a0f]">
        Entrar na sua conta
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className={LABEL}>
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            placeholder="voce@empresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className={LABEL}>
            Senha
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${FIELD} pr-[50px]`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              className="absolute right-[3px] top-[3px] flex h-11 w-11 items-center justify-center rounded-[10px] text-[#5e6661] hover:text-[#011a0f]"
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>
        </div>

        <div className="flex min-h-[44px] flex-wrap items-center gap-3">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-[14px] text-[#3d4640]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-5 w-5 accent-[#011a0f]"
            />
            Lembrar de mim
          </label>
          <Link
            href="/forgot-password"
            className="ml-auto text-[14px] font-semibold text-[#0b6b4f] hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>

        {error && (
          <p className="text-[13.5px] font-medium text-[#b03030]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-[52px] w-full items-center justify-center rounded-[12px] bg-[#011a0f] text-[15.5px] font-semibold text-white transition-colors hover:bg-[#0b3b2e] disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-center text-[14.5px] text-[#3d4640]">
        Ainda não tem conta?{" "}
        <Link
          href="/register"
          className="text-[14px] font-semibold text-[#0b6b4f] hover:underline"
        >
          Comece seu cadastro
        </Link>
      </p>

      <div className="mt-2 flex items-center justify-center gap-[7px] text-[12.5px] text-[#5e6661]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </svg>
        Conexão protegida · dados criptografados
      </div>
    </div>
  );
}
