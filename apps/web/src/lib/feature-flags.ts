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
  /** "Cotações" (PTAX reference quotes) section. Default OFF. */
  cotacoes: process.env.NEXT_PUBLIC_FEATURE_COTACOES === "true",
  /**
   * History chart + Mín/Máx/Média/Abertura on Cotações (backed by `/v1/ptax/history`).
   * Default OFF.
   */
  cotacoesChart: process.env.NEXT_PUBLIC_FEATURE_COTACOES_CHART === "true",
  /**
   * Reference calculator on Cotações (backed by `/v1/ptax/convert`; auto-hides on
   * server 404 `{ code: "feature_disabled" }`). Default OFF.
   */
  cotacoesCalculadora:
    process.env.NEXT_PUBLIC_FEATURE_COTACOES_CALCULADORA === "true",
  /** Legacy price alerts widget on Cotações. Default OFF. */
  cotacoesAlertas: process.env.NEXT_PUBLIC_FEATURE_COTACOES_ALERTAS === "true",
  /** "Depósito" (PIX deposit) section. */
  deposito: process.env.NEXT_PUBLIC_FEATURE_DEPOSITO === "true",
  /** "Empresa" (cadastral data, PEP declaration, Avenia docs & limits). Default OFF. */
  empresa: process.env.NEXT_PUBLIC_FEATURE_EMPRESA === "true",
  /**
   * "Enviar" (outbound remittance) section. Flag + `/enviar` routes land with
   * PR #37 (`feat/enviar`), not merged into this branch — so this is off here
   * and the Início header's "Transferir" button and the quick-actions "Enviar"
   * entry render disabled/omitted until it ships. Expect a small merge conflict
   * on this line with PR #37, which defines the same flag.
   * "Enviar" (outbound remittance in BRL/USD/EUR) section. Default OFF.
   * Ship as Preview-only first: set NEXT_PUBLIC_FEATURE_ENVIAR=true in the
   * Preview environment; turning it on in Production is a separate decision
   * (requires a redeploy). Gates the menu item, the Início balance-card button,
   * and the whole /enviar/* route tree (404 when off).
   */
  enviar: process.env.NEXT_PUBLIC_FEATURE_ENVIAR === "true",
} as const;
