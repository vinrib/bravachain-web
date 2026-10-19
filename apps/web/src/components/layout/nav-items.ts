import {
  LayoutDashboard,
  Receipt,
  Landmark,
  LineChart,
  ArrowLeftRight,
  ArrowDownToDot,
  Settings,
} from "lucide-react";
import { featureFlags } from "@/lib/feature-flags";
import { PixIcon } from "@/components/icons/pix-icon";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Single source of truth for the dashboard navigation.
 * Order (flags on): Início, Depósito, Instruções de recebimento, Saque PIX,
 * Extrato, Cotações, Dashboard financeiro, Dados de conta. Configurações lives
 * in the sidebar footer (filtered out of the main loop there).
 */
export const navItems: NavItem[] = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  // Behind NEXT_PUBLIC_FEATURE_DEPOSITO (default off).
  ...(featureFlags.deposito
    ? [{ href: "/deposito", label: "Depósito", icon: ArrowDownToDot }]
    : []),
  // Behind NEXT_PUBLIC_FEATURE_RECEBIMENTOS (default off). "Recebimentos" foi
  // removido; o recebimento acontece via "Instruções de recebimento".
  ...(featureFlags.recebimentos
    ? [
        {
          href: "/instrucoes-de-recebimento",
          label: "Instruções de recebimento",
          icon: Landmark,
        },
      ]
    : []),
  { href: "/saque", label: "Saque PIX", icon: PixIcon },
  { href: "/extrato", label: "Extrato", icon: Receipt },
  // Behind NEXT_PUBLIC_FEATURE_COTACOES (default off).
  ...(featureFlags.cotacoes
    ? [{ href: "/cotacoes", label: "Cotações", icon: ArrowLeftRight }]
    : []),
  // Behind NEXT_PUBLIC_FEATURE_DASHBOARD (default off).
  ...(featureFlags.dashboard
    ? [{ href: "/financeiro", label: "Dashboard financeiro", icon: LineChart }]
    : []),
  // Behind NEXT_PUBLIC_FEATURE_DADOS_CONTA (default off).
  ...(featureFlags.dadosConta
    ? [{ href: "/dados-de-conta", label: "Dados de conta", icon: Landmark }]
    : []),
  // Settings lives in the sidebar footer; also surfaced in the mobile "Mais" sheet.
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
