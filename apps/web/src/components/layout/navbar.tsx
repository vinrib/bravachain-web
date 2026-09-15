"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-provider";
import { LangToggle } from "@/components/i18n-provider";

export function Navbar() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      // Even if revocation fails, drop the user to login; cookies are cleared server-side.
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span className="text-xs font-bold text-primary-foreground">B</span>
        </div>
        <span className="text-sm font-bold text-foreground">Bravachain</span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <LangToggle />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={signingOut}
          className="gap-2 h-11"
        >
          {signingOut ? <Spinner size="sm" /> : <LogOut className="h-4 w-4" />}
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
