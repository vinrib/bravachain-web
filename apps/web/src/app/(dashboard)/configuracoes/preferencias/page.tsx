"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n-provider";

const LANGS = [
  { value: "pt", label: "Português", short: "PT" },
  { value: "en", label: "English", short: "EN" },
] as const;

export default function PreferenciasPage() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Configurações
        </Link>
        <h1 className="mt-2 font-serif text-[30px] font-bold text-foreground">Preferências</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha o idioma da interface.</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Idioma</p>
          <div className="space-y-2">
            {LANGS.map((l) => {
              const active = locale === l.value;
              return (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLocale(l.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="font-medium">{l.label}</span>
                  <span className={cn("text-xs font-semibold", active ? "text-primary" : "text-muted-foreground")}>
                    {active ? "Selecionado" : l.short}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
