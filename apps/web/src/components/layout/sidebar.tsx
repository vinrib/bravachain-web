"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, isActive } from "./nav-items";
import { SettingsIcon } from "@/components/icons/nav-icons";
import { Logo } from "@/components/ui/logo";
import { useMe, useIsAdmin } from "@/lib/hooks";
import { ADMIN_HOME } from "@/lib/mfa/routes";

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "—";
}

export function Sidebar() {
  const pathname = usePathname();
  const me = useMe();
  const isAdmin = useIsAdmin();
  const tAdmin = useTranslations("admin");
  const name = me.data?.name?.trim() || null;

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo size="md" />
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems
          .filter((i) => i.href !== "/configuracoes")
          .map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#011a0f] text-white dark:bg-primary dark:text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        {/* Admin entry point — only rendered for admins (role-based). */}
        {isAdmin && (
          <Link
            href={ADMIN_HOME}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(pathname, ADMIN_HOME)
                ? "bg-[#011a0f] text-white dark:bg-primary dark:text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {tAdmin("sidebarLink")}
          </Link>
        )}

        {/* Configurações in the footer, per the canvas. */}
        <Link
          href="/configuracoes"
          className={cn(
            "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(pathname, "/configuracoes")
              ? "bg-[#011a0f] text-white dark:bg-primary dark:text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <SettingsIcon className="h-4 w-4 shrink-0" />
          Configurações
        </Link>

        {name ? (
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              {me.data?.email && (
                <p className="truncate text-xs text-muted-foreground">{me.data.email}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="px-2 text-center text-xs text-muted-foreground">
            Pagamentos internacionais, liquidação em reais
          </p>
        )}
      </div>
    </aside>
  );
}
