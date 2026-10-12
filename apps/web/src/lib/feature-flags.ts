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
  /** "Dados de conta" (dedicated USD/EUR account details) section. */
  dadosConta: process.env.NEXT_PUBLIC_FEATURE_DADOS_CONTA === "true",
} as const;
