"use client";

import { clearToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-provider";
import { LangToggle } from "@/components/i18n-provider";

export function Navbar() {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Left: page title slot (empty, handled per-page) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span className="text-xs font-bold text-white">B</span>
        </div>
        <span className="text-sm font-bold text-foreground">Bravachain</span>
      </div>

      {/* Right: actions */}
      <div className="ml-auto flex items-center gap-1">
        <LangToggle />
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Notificações" className="h-11 w-11">
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 h-11"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
