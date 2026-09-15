import { LayoutDashboard, Receipt, Banknote, ShieldCheck } from "lucide-react";

/** Single source of truth for the cooperative dashboard navigation. */
export const navItems = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/extrato", label: "Extrato", icon: Receipt },
  { href: "/saque", label: "Saque PIX", icon: Banknote },
  { href: "/cadastro", label: "Verificação", icon: ShieldCheck },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
