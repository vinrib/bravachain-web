"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, isActive, type NavItem } from "./nav-items";

// The four primary slots (in order); the rest go under "Mais".
const PRIMARY_HREFS = ["/", "/recebimentos", "/saque", "/extrato"] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  // navItems already respects the feature flags (disabled screens are absent).
  const primary: NavItem[] = PRIMARY_HREFS.map((h) =>
    navItems.find((i) => i.href === h),
  ).filter((i): i is NavItem => Boolean(i));
  const more: NavItem[] = navItems.filter((i) => !PRIMARY_HREFS.includes(i.href as (typeof PRIMARY_HREFS)[number]));

  const moreActive = more.some((i) => isActive(pathname, i.href));

  // Close the sheet on route change, and on Esc.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSheetOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!sheetOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSheetOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  function slotClass(active: boolean) {
    return cn(
      "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 border-t-2 py-2 transition-colors",
      active
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground active:text-foreground",
    );
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegação principal"
      >
        {primary.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} className={slotClass(active)}>
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
              <span className={cn("w-full truncate px-1 text-center text-[11px] leading-none", active && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}

        {more.length > 0 && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className={slotClass(moreActive)}
          >
            <MoreHorizontal className={cn("h-5 w-5 shrink-0", moreActive && "text-primary")} />
            <span className={cn("text-[11px] leading-none", moreActive && "font-semibold")}>Mais</span>
          </button>
        )}
      </nav>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Mais opções">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-card pb-[env(safe-area-inset-bottom)] shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Mais</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2">
              {more.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#011a0f] text-white dark:bg-primary dark:text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
