"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems, isActive } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-border bg-card"
      aria-label="Navegação principal"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors min-h-[56px]",
              active ? "text-primary" : "text-muted-foreground active:text-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
