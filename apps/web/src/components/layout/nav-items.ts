import {
  LayoutDashboard,
  Receipt,
  Banknote,
  ShieldCheck,
  ArrowDownToLine,
  type LucideIcon,
} from "lucide-react";
import { featureFlags } from "@/lib/feature-flags";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Single source of truth for the dashboard navigation. */
export const navItems: NavItem[] = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/extrato", label: "Extrato", icon: Receipt },
  // Behind NEXT_PUBLIC_FEATURE_RECEBIMENTOS (default off).
  ...(featureFlags.recebimentos
    ? [{ href: "/recebimentos", label: "Recebimentos", icon: ArrowDownToLine }]
    : []),
  { href: "/saque", label: "Saque PIX", icon: Banknote },
  { href: "/cadastro", label: "Verificação", icon: ShieldCheck },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
