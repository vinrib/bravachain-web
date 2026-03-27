"use client";

import { clearToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function Navbar() {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-end border-b border-border bg-card px-6">
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </header>
  );
}
