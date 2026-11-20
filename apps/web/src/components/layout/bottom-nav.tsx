"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { mobileNavLinks, isActive, type MobileNavLink } from "./nav-items";
import { QuickActionsSheet } from "@/components/dashboard/quick-actions-sheet";

/**
 * Mobile bottom bar (Web 14 — Marcia Alves mockup): five positions, reading
 * Início · Pagamentos · (+) · Extrato · Empresa. The central "+" is an elevated
 * circular button that opens the quick-actions sheet; the other four are links
 * (see `mobileNavLinks`). Hidden on md+ (the sidebar takes over).
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("home.nav");
  const [actionsOpen, setActionsOpen] = useState(false);

  const [first, second, ...rest] = mobileNavLinks;
  const left = [first, second].filter(Boolean) as MobileNavLink[];
  const right = rest;

  function Slot({ link }: { link: MobileNavLink }) {
    const { href, labelKey, icon: Icon } = link;
    const active = isActive(pathname, href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors active:text-foreground",
          active && "text-primary",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        <span className={cn("truncate text-[11px] leading-none", active && "font-semibold")}>
          {t(labelKey)}
        </span>
      </Link>
    );
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegação principal"
      >
        {left.map((link) => (
          <Slot key={link.key} link={link} />
        ))}

        {/* Elevated central "+" — opens the quick-actions sheet. */}
        <div className="flex w-16 shrink-0 items-start justify-center">
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            aria-label={t("openActions")}
            aria-haspopup="dialog"
            aria-expanded={actionsOpen}
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#011a0f] text-white shadow-lg ring-4 ring-card transition-colors hover:bg-[#0b3b2e] dark:bg-primary dark:text-primary-foreground"
          >
            <Plus className="h-6 w-6" aria-hidden />
          </button>
        </div>

        {right.map((link) => (
          <Slot key={link.key} link={link} />
        ))}
      </nav>

      <QuickActionsSheet open={actionsOpen} onClose={() => setActionsOpen(false)} />
    </>
  );
}
