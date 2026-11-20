"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin, useLogout } from "@/lib/hooks";
import { SettingsIcon } from "@/components/icons/nav-icons";
import { Spinner } from "@/components/ui/spinner";
import { isActive } from "@/components/layout/nav-items";
import { ADMIN_HOME } from "@/lib/mfa/routes";

/**
 * Bottom sheet opened from the Início avatar (Web 14). Replaces the old
 * bottom-nav "Mais" sheet, which no longer exists now that the bar is fixed
 * at 4 slots — this is the only mobile path to Configurações/Admin/Sair, so
 * reaching it from another page means tapping "Início" first.
 */
export function AccountMenuSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const { signingOut, handleLogout } = useLogout();
  const tAdmin = useTranslations("admin");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const itemClass = (active: boolean) =>
    cn(
      "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-[#011a0f] text-white dark:bg-primary dark:text-primary-foreground"
        : "text-foreground hover:bg-muted",
    );

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu da conta">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-card pb-[env(safe-area-inset-bottom)] shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Conta</p>
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
          {isAdmin && (
            <Link href={ADMIN_HOME} className={itemClass(isActive(pathname, ADMIN_HOME))}>
              <ShieldCheck className="h-5 w-5 shrink-0" />
              {tAdmin("sidebarLink")}
            </Link>
          )}
          <Link href="/configuracoes" className={itemClass(isActive(pathname, "/configuracoes"))}>
            <SettingsIcon className="h-5 w-5 shrink-0" />
            Configurações
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {signingOut ? <Spinner size="sm" /> : <LogOut className="h-5 w-5 shrink-0" />}
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
