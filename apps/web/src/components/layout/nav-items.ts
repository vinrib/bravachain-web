import { LineChart } from "lucide-react";
import { featureFlags } from "@/lib/feature-flags";
import { PixIcon } from "@/components/icons/pix-icon";
import {
  HomeIcon,
  BankIcon,
  StatementIcon,
  RatesIcon,
  ReceiveIcon,
  DepositCardIcon,
  SettingsIcon,
} from "@/components/icons/nav-icons";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Single source of truth for the dashboard navigation.
 * Order (flags on): Início, Dados de conta, Depósito, Instruções de recebimento,
 * Saque PIX, Extrato, Cotações, Dashboard financeiro. Configurações lives in the
 * sidebar footer (filtered out of the main loop there). Icons are custom SVGs
 * (see components/icons/nav-icons); Saque keeps the PIX mark and Dashboard the
 * line-chart.
 */
export const navItems: NavItem[] = [
  { href: "/", label: "Início", icon: HomeIcon },
  // Behind NEXT_PUBLIC_FEATURE_DADOS_CONTA (default off). Second option.
  ...(featureFlags.dadosConta
    ? [{ href: "/dados-de-conta", label: "Dados de conta", icon: BankIcon }]
    : []),
  // Behind NEXT_PUBLIC_FEATURE_DEPOSITO (default off).
  ...(featureFlags.deposito
    ? [{ href: "/deposito", label: "Depósito", icon: DepositCardIcon }]
    : []),
  // Behind NEXT_PUBLIC_FEATURE_RECEBIMENTOS (default off). "Recebimentos" foi
  // removido; o recebimento acontece via "Instruções de recebimento".
  ...(featureFlags.recebimentos
    ? [
        {
          href: "/instrucoes-de-recebimento",
          label: "Instruções de recebimento",
          icon: ReceiveIcon,
        },
      ]
    : []),
  { href: "/saque", label: "Saque PIX", icon: PixIcon },
  { href: "/extrato", label: "Extrato", icon: StatementIcon },
  // Behind NEXT_PUBLIC_FEATURE_COTACOES (default off).
  ...(featureFlags.cotacoes
    ? [{ href: "/cotacoes", label: "Cotações", icon: RatesIcon }]
    : []),
  // Behind NEXT_PUBLIC_FEATURE_DASHBOARD (default off).
  ...(featureFlags.dashboard
    ? [{ href: "/financeiro", label: "Dashboard financeiro", icon: LineChart }]
    : []),
  // Settings lives in the sidebar footer; also surfaced in the mobile "Mais" sheet.
  { href: "/configuracoes", label: "Configurações", icon: SettingsIcon },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export interface MobileNavSlot {
  key: string;
  href: string;
  /** Key relative to the `home.nav` locale namespace (e.g. `t(labelKey)` with `useTranslations("home.nav")`). */
  labelKey: string;
  /** Rendered `aria-hidden` — the slot's visible label already names the link. */
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Fixed position in the bar — lower renders first. */
  position: number;
}

/**
 * The 4-item mobile bottom nav (Web 14): Início, Enviar, Saque PIX, Extrato.
 * Deliberately separate from `navItems` above — the sidebar keeps every
 * flagged route and its own (untranslated) labels; this bar only ever shows
 * these 4 fixed slots, always labeled via the `home.nav` locale namespace.
 *
 * Position 2 ("Enviar") is reserved for PR #37 (`feat/enviar`), not merged
 * into `main` as of this branch — so `NEXT_PUBLIC_FEATURE_ENVIAR` and
 * `/enviar` don't exist here yet. When it lands, add:
 *   { key: "send", href: "/enviar", labelKey: "send", icon: SendIcon, position: 2 }
 * gated by `featureFlags.enviar`, and nothing else in BottomNav needs to change.
 */
export const mobileNavSlots: MobileNavSlot[] = [
  { key: "home", href: "/", labelKey: "home", icon: HomeIcon, position: 1 },
  { key: "saque", href: "/saque", labelKey: "saquePix", icon: PixIcon, position: 3 },
  { key: "extrato", href: "/extrato", labelKey: "extrato", icon: StatementIcon, position: 4 },
].sort((a, b) => a.position - b.position);
