"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { mobileNavSlots, isActive } from "./nav-items";

/**
 * The 4-slot mobile bottom nav (Web 14): Início, Enviar (reserved — see
 * `mobileNavSlots`), Saque PIX, Extrato. No overflow "Mais" sheet and no
 * central "+": Configurações/Área administrativa/Sair moved to the avatar
 * menu on Início (see AccountMenuSheet), and every other flagged route lives
 * only in the (desktop) sidebar — see nav-items.ts for why that's intentional.
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("home.nav");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navegação principal"
    >
      {mobileNavSlots.map(({ key, href, labelKey, icon: Icon }) => {
        const active = isActive(pathname, href);
        const label = t(labelKey);
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors active:text-foreground"
          >
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors",
                active && "bg-[#011a0f] text-white dark:bg-primary dark:text-primary-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span
                className={cn(
                  "truncate text-[11px] leading-none",
                  active ? "font-semibold" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
