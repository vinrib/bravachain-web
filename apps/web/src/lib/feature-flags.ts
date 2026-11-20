/**
 * Client-and-server readable feature flags. `NEXT_PUBLIC_*` vars are inlined at
 * build time, so these evaluate the same in Server Components, the proxy, and
 * Client Components. All default OFF.
 */
export const featureFlags = {
  /** Inbound remittance (Wire-In) "Recebimentos" section. */
  recebimentos: process.env.NEXT_PUBLIC_FEATURE_RECEBIMENTOS === "true",
  /**
   * "Renovar link" action. Blocked until the backend returns the internal
   * InboundRemittance.id needed by POST /v1/receive/:id/renew-token.
   */
  recebimentosRenew:
    process.env.NEXT_PUBLIC_FEATURE_RECEBIMENTOS_RENEW === "true",
  /** Extrato backed by /v1/statement (filters, pagination, server export). */
  extratoV2: process.env.NEXT_PUBLIC_FEATURE_EXTRATO_V2 === "true",
  /** "Dados de conta" (dedicated USD/EUR account details) section. */
  dadosConta: process.env.NEXT_PUBLIC_FEATURE_DADOS_CONTA === "true",
  /** "Comprovantes" (PIX withdrawal receipts) tab in Extrato. */
  recibos: process.env.NEXT_PUBLIC_FEATURE_RECIBOS === "true",
  /** "Dashboard financeiro" section. */
  dashboard: process.env.NEXT_PUBLIC_FEATURE_DASHBOARD === "true",
  /** "Cotações" (FX rates) section. */
  cotacoes: process.env.NEXT_PUBLIC_FEATURE_COTACOES === "true",
  /**
   * History chart + Mín/Máx/Média/% on Cotações. Default OFF: the backend only
   * has ~2 weeks of real daily data, the plotted dataPoints are downsampled
   * (3M → 2 points, 1Y → 1), stats don't match the plotted series, and future
   * dates are carried forward. Keep off until the history series is complete.
   */
  cotacoesChart: process.env.NEXT_PUBLIC_FEATURE_COTACOES_CHART === "true",
  /** "Depósito" (PIX deposit) section. */
  deposito: process.env.NEXT_PUBLIC_FEATURE_DEPOSITO === "true",
  /**
   * "Enviar" (outbound remittance in BRL/USD/EUR) section. Default OFF.
   * Ship as Preview-only first: set NEXT_PUBLIC_FEATURE_ENVIAR=true in the
   * Preview environment; turning it on in Production is a separate decision
   * (requires a redeploy). Gates the menu item, the Início balance-card button,
   * and the whole /enviar/* route tree (404 when off).
   */
  enviar: process.env.NEXT_PUBLIC_FEATURE_ENVIAR === "true",
} as const;
