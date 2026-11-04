import { Logo } from "@/components/ui/logo";

/**
 * Mobile-only brand bar. Language/theme selectors moved to Configurações →
 * Preferências; "Sair" moved to the sidebar footer (desktop) and the bottom
 * nav's "Mais" sheet (mobile) — see Sidebar and BottomNav.
 */
export function Navbar() {
  return (
    <header className="flex h-14 items-center border-b border-border bg-card px-4 md:hidden">
      <Logo size="sm" />
    </header>
  );
}
