"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowDownToLine, Send, X } from "lucide-react";
import { PixIcon } from "@/components/icons/pix-icon";
import { featureFlags } from "@/lib/feature-flags";

interface Action {
  key: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

/**
 * Bottom sheet opened by the central "+" of the mobile bottom bar (Web 14).
 * Lists only actions whose route exists: Receber and Saque PIX always; Enviar
 * only when `NEXT_PUBLIC_FEATURE_ENVIAR` is on (its `/enviar` route ships with
 * PR #37, not on this branch) — no phantom/disabled entry otherwise.
 */
export function QuickActionsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("home.quick");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const actions: Action[] = [
    { key: "receive", href: "/instrucoes-de-recebimento", label: t("receive"), icon: ArrowDownToLine },
    { key: "saque", href: "/saque", label: t("saquePix"), icon: PixIcon },
    ...(featureFlags.enviar
      ? [{ key: "enviar", href: "/enviar", label: t("enviar"), icon: Send }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t("title")}>
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-card pb-[env(safe-area-inset-bottom)] shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{t("title")}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-2">
          {actions.map(({ key, href, label, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
