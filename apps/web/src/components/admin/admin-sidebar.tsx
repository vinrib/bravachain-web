"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Users, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  ADMIN_CLIENTS,
  ADMIN_SECURITY,
  MFA_ENROLLMENT_PATH,
} from "@/lib/mfa/routes";

interface AdminNavItem {
  href: string;
  labelKey: "clients" | "security" | "mfa";
  icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: AdminNavItem[] = [
  { href: ADMIN_CLIENTS, labelKey: "clients", icon: Users },
  { href: ADMIN_SECURITY, labelKey: "security", icon: ShieldCheck },
  { href: MFA_ENROLLMENT_PATH, labelKey: "mfa", icon: KeyRound },
];

function active(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo size="md" />
      </div>

      <div className="px-5 pt-5 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("title")}
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-1">
        {ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const isActive = active(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#011a0f] text-white dark:bg-primary dark:text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {t("backToApp")}
        </Link>
      </div>
    </aside>
  );
}

/** Compact top bar shown on mobile (the sidebar is desktop-only). */
export function AdminMobileBar() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden">
      <Link
        href="/"
        aria-label={t("backToApp")}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      {ITEMS.map(({ href, labelKey, icon: Icon }) => {
        const isActive = active(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#011a0f] text-white dark:bg-primary dark:text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
