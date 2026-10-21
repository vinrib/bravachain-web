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
  statement: {
    /** GET (Bearer) ?startDate&endDate&type=ALL|INBOUND|WITHDRAWAL&page&limit(≤100)
     *  -> { summary, transactions[], pagination } */
    list: "/v1/statement",
    /** GET (Bearer) ?...&format=csv|pdf -> file (attachment) */
    export: "/v1/statement/export",
    /** GET (Bearer) type=inbound|withdrawal -> detail */
    detail: (type: string, id: string) => `/v1/statement/${type}/${id}`,
  },
  receipts: {
    /** GET (Bearer + KYB) ?page&limit -> { summary, receipts[], pagination } (só saques PIX concluídos) */
    list: "/v1/receipts",
    /** GET (Bearer) -> comprovante completo */
    detail: (withdrawalId: string) => `/v1/receipts/${withdrawalId}`,
    /** GET (Bearer) -> application/pdf (attachment) */
    pdf: (withdrawalId: string) => `/v1/receipts/${withdrawalId}/pdf`,
    /** POST (Bearer) { recipientEmail } -> { sent, recipientEmail } */
    sendEmail: (withdrawalId: string) => `/v1/receipts/${withdrawalId}/send-email`,
  },
  withdrawals: {
    /** POST (Bearer, KYB-approved) { amountBrla, pixKey, pixKeyType } */
    createPix: "/v1/withdraw/pix",
    /**
     * POST (Bearer) { amountBrla, pixKeyType? } -> { amountBrla, feeBrl,
     * netAmountBrl, currency }. Prévia de tarifa/líquido; NÃO executa o saque.
     */
    previewPix: "/v1/withdraw/pix/preview",
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
  profile: {
    /** GET -> { companyDisplayName, companyLogoUrl (signed 24h) };
     *  POST multipart (logo + companyDisplayName) to update. */
    branding: "/v1/profile/branding",
  },
  onboarding: {
    /** GET (OnboardingController) -> KYB status + documents sent/pending. */
    status: "/v1/onboarding/status",
  },
  receive: {
    /** GET (Bearer + KYB) -> { accounts: DedicatedAccount[], pendingCurrencies } */
    accounts: "/v1/receive/accounts",
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
  /**
   * Deposit via PIX. POST creates a QR (Idempotency-Key); GET polls status.
   * Responses are not typed in the committed openapi.json.
   */
  deposit: {
    /** POST (Idempotency-Key) { valor, descricao } -> { txid, pixCopiaECola, expiresAt, status, ... } */
    pixQrCode: "/v1/pix/qrcode",
    /** GET -> { txid, status, ... } */
    pixStatus: (txid: string) => `/v1/pix/status/${txid}`,
  },
  /**
   * FX rates (Cotações). Responses are not typed in the committed openapi.json;
   * the frontend normalizers (apps/web/src/lib/rates) map the real keys.
   */
  rates: {
    /** GET -> { USD_BRL, EUR_BRL } live rates (no pair param). */
    live: "/v1/rates/live",
    /** GET ?pair=USD_BRL|EUR_BRL&period=1D|1W|1M|3M|1Y -> { pair, period, dataPoints, stats } */
    history: "/v1/rates/history",
    /** GET ?pair&amount -> { pair, amount, result, rate } */
    convert: "/v1/rates/convert",
    /** GET list; POST create; PATCH {id}; DELETE {id} — rate alerts (Bearer). */
    alerts: "/v1/rates/alerts",
    alert: (id: string) => `/v1/rates/alerts/${id}`,
  },
  /**
   * Financial dashboard. All GET (Bearer) with ?period=30d|90d|12m|ytd.
   * NOTE: responses are not typed in the committed openapi.json — the frontend
   * normalizers (apps/web/src/lib/dashboard) map the real keys defensively.
   */
  dashboard: {
    summary: "/v1/dashboard/financial/summary",
    tpv: "/v1/dashboard/financial/tpv",
    rates: "/v1/dashboard/financial/rates",
    rails: "/v1/dashboard/financial/rails",
    /** Combined payload (if used). */
    financial: "/v1/dashboard/financial",
  },
} as const;

export type Endpoints = typeof endpoints;
