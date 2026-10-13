/**
 * Manually-typed shapes for the inbound-remittance (Wire-In) endpoints. The
 * backend returns these (main), but the committed openapi.json does not type
 * them. Keep in sync with the backend; remove once the spec is regenerated.
 */

export type ReceiveMethod =
  | "USD_WIRE"
  | "USD_ACH"
  | "EUR_SEPA"
  | "USDT_TRON"
  | "USDT_EVM"
  | "USDC_EVM"
  | "USDC_TRON";

/** Methods exposed in the UI today. Crypto methods are intentionally hidden. */
export const UI_METHODS = ["USD_WIRE", "USD_ACH", "EUR_SEPA"] as const;
export type UiReceiveMethod = (typeof UI_METHODS)[number];

export interface CreateReceiveBody {
  method: ReceiveMethod;
  amount: number;
  /** Optional: defaults to the user's standing PIX key when omitted. */
  pixKey?: string;
}

/** Present only when the backend spread flag is on. All values are strings. */
export interface FeeBreakdown {
  grossBrl: string;
  percentChargeBrl: string;
  fixedChargeBrl: string;
  totalChargeBrl: string;
  netEstimateBrl: string;
  effectiveRate: string;
}

export interface CreateReceiveResponse {
  ticketId: string;
  method: ReceiveMethod;
  inputCurrency: string;
  /** Raw Avenia payload — NOT for display. */
  depositInstructions?: unknown;
  estimatedBrl?: string;
  expiresAt?: string;
  markupFloatingFee?: unknown;
  totalFeePercent?: unknown;
  shareToken: string;
  shareTokenExpiresAt?: string;
  feeBreakdown?: FeeBreakdown;
}

export interface BankDetailsUSD {
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  swiftCode: string;
  beneficiaryName: string;
  wireMemo: string;
}

export interface BankDetailsEUR {
  bankName: string;
  iban: string;
  bic: string;
  beneficiaryName: string;
  wireMemo: string;
}

export type BankDetails = BankDetailsUSD | BankDetailsEUR;

export interface Instructions {
  type: "BANK_TRANSFER";
  method: ReceiveMethod;
  methodLabel: string;
  ticketId: string;
  amount: string | number;
  currency: string;
  bankDetails: BankDetails;
  settlementTime?: string;
  instructions: string[];
  /** Non-null while Avenia hasn't confirmed the dedicated account. */
  warning: string | null;
}

export interface Exporter {
  displayName: string;
  /** May be a raw S3 key today; only render when it starts with "https://". */
  logoUrl: string | null;
  country?: string;
}

/** Public /pay/:shareToken payload: instructions + exporter branding. */
export interface PublicInstructions extends Instructions {
  exporter: Exporter;
  createdAt?: string;
}

export interface ReceiveStatus {
  ticketId: string;
  method: ReceiveMethod;
  status: string;
  /** Raw Avenia payload — NOT for display. */
  depositInstructions?: unknown;
  estimatedBrl?: string;
  providerStatus?: string;
}

export interface PixKeyResponse {
  pixKey: string | null;
  message?: string;
}

/** A dedicated inbound bank account (GET /v1/receive/accounts). */
export interface DedicatedAccount {
  currency: "USD" | "EUR";
  bankName?: string;
  beneficiaryName?: string;
  accountNumber?: string;
  routingNumber?: string;
  iban?: string;
  swift?: string;
  reference?: string;
  confirmedAt?: string;
}

export interface AccountsResponse {
  accounts: DedicatedAccount[];
  /** Currencies whose dedicated account is still being set up. */
  pendingCurrencies: string[];
}
