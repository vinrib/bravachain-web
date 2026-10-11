/**
 * Backend endpoint paths, centralized.
 *
 * Reconciled against the backend OpenAPI (generated from src, NestJS, no global
 * prefix). The frontend uses the `public-api` surface (`/v1/*`) for auth,
 * wallet and withdrawals; KYC status/submit live under `/kyc` (no version
 * prefix). This is the single place to adjust if the backend routes change.
 */
export const endpoints = {
  auth: {
    /** POST { email, password } -> { user, accessToken, refreshToken } */
    login: "/v1/auth/login",
    /**
     * POST { name, email, password, documentNumber, accountType }
     * -> { user, accessToken, refreshToken, kycUrl, basicCompanyDataUrl,
     *      authorizedRepresentativeUrl } (Avenia links per account type)
     */
    signup: "/v1/auth/signup",
    /** POST { refreshToken } -> { user, accessToken, refreshToken } (rotation) */
    refresh: "/v1/auth/refresh",
    /**
     * POST { email } -> 200 { message } ALWAYS (never reveals whether the
     * account exists); 429 when rate-limited.
     *
     * NOTE: present on the backend (main @ 8c74ac1, in production) but not yet
     * reflected in the committed `openapi.json`. Do not hand-edit that schema;
     * regenerate it from the backend when convenient.
     */
    forgotPassword: "/v1/auth/forgot-password",
    /**
     * POST { token, newPassword } -> 200 { message: "Senha redefinida com
     * sucesso." }; 401 when the token is invalid, expired, or already used.
     *
     * NOTE: same stale-schema caveat as `forgotPassword` above.
     */
    resetPassword: "/v1/auth/reset-password",
    /** POST (Bearer) -> { message } — invalidates the stored refresh token */
    logout: "/v1/auth/logout",
    /** GET (Bearer) -> { id, email, name, kycStatus } */
    me: "/auth/me",
  },
  kyc: {
    /** GET -> { ready, localKycStatus, identityStatus?, ... } */
    status: "/kyc/status",
    /**
     * POST { name, redirectUrl?, documentNumber?, accountType? }
     * -> Avenia links (kycUrl for PF; basicCompanyDataUrl +
     *    authorizedRepresentativeUrl for PJ) + attemptId
     */
    submit: "/kyc/submit",
  },
  wallet: {
    /** GET (Bearer) -> { userId, accounts: [{ id, currency, balance, ... }] } */
    balance: "/v1/wallet",
    /** GET (Bearer) -> ledger entries (extrato) */
    history: "/v1/wallet/history",
  },
  withdrawals: {
    /** POST (Bearer, KYB-approved) { amountBrla, pixKey, pixKeyType } */
    createPix: "/v1/withdraw/pix",
    /** GET (Bearer) -> últimos saques */
    list: "/v1/withdraw/pix",
  },
  /**
   * Inbound remittance (Wire-In). All require Bearer + approved KYB except
   * `pay`/`payPdf`, which are public (share link for the importer).
   *
   * NOTE: present on the backend (`main`) but the committed `openapi.json` does
   * not type these request/response bodies; see apps/web/src/lib/receive/types.ts
   * for the manually-typed shapes. Do not hand-edit openapi.json.
   */
  receive: {
    /** POST (Idempotency-Key) { method, amount, pixKey? } -> CreateReceiveResponse */
    requestPayment: "/v1/receive/request-payment",
    /** GET -> { pixKey }; PUT { pixKey } -> { pixKey, message }; DELETE -> { pixKey:null, message } */
    pixKey: "/v1/receive/pix-key",
    /** GET -> formatted bank-transfer instructions */
    instructions: (ticketId: string) => `/v1/receive/${ticketId}/instructions`,
    /** GET -> { ticketId, method, status, ... } */
    status: (ticketId: string) => `/v1/receive/${ticketId}/status`,
    /** GET (public) -> instructions + exporter + createdAt; 404/410 */
    pay: (shareToken: string) => `/v1/receive/pay/${shareToken}`,
    /** GET (public) -> application/pdf */
    payPdf: (shareToken: string) => `/v1/receive/pay/${shareToken}/pdf`,
    /** POST -> renews the share link (+30d). Uses InboundRemittance.id, NOT ticketId. */
    renewToken: (id: string) => `/v1/receive/${id}/renew-token`,
  },
} as const;

export type Endpoints = typeof endpoints;
