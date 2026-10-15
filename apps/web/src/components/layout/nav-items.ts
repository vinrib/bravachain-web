import {
  LayoutDashboard,
  Receipt,
  Banknote,
  ShieldCheck,
  ArrowDownToLine,
  Landmark,
  LineChart,
  FileText,
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
  // Behind NEXT_PUBLIC_FEATURE_DASHBOARD (default off).
  ...(featureFlags.dashboard
    ? [{ href: "/financeiro", label: "Dashboard financeiro", icon: LineChart }]
    : []),
  { href: "/extrato", label: "Extrato", icon: Receipt },
  // Behind NEXT_PUBLIC_FEATURE_RECEBIMENTOS (default off).
  ...(featureFlags.recebimentos
    ? [
        { href: "/recebimentos", label: "Recebimentos", icon: ArrowDownToLine },
        {
          href: "/instrucoes-de-recebimento",
          label: "Instruções de recebimento",
          icon: FileText,
        },
      ]
    : []),
  // Behind NEXT_PUBLIC_FEATURE_DADOS_CONTA (default off).
  ...(featureFlags.dadosConta
    ? [{ href: "/dados-de-conta", label: "Dados de conta", icon: Landmark }]
    : []),
  { href: "/saque", label: "Saque PIX", icon: Banknote },
  { href: "/cadastro", label: "Verificação", icon: ShieldCheck },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
