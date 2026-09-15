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
} as const;

export type Endpoints = typeof endpoints;
