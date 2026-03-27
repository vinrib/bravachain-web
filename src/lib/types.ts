export type Currency = "BRL" | "USDC" | "EURC" | "BRZ";

export interface CurrencyInfo {
  code: Currency;
  name: string;
  symbol: string;
  flag: string;
  color: string;
}

export interface WalletBalance {
  currency: Currency;
  balance: number;
  balance_brl: number;
}

export interface WalletData {
  balances: WalletBalance[];
  total_brl: number;
}

export type TransactionType = "send" | "receive" | "convert" | "deposit";
export type TransactionStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  counterparty: string;
  description: string;
  created_at: string;
  status: TransactionStatus;
}

export interface RatesResponse {
  rates: Record<string, number>;
}

export type KycStatusValue = "verified" | "pending" | "not_submitted";

export interface KycStatus {
  status: KycStatusValue;
  name?: string;
  submitted_at?: string;
  verified_at?: string;
}

export interface TransferPayload {
  amount: number;
  from_currency: Currency;
  to_currency: Currency;
  recipient_name: string;
  recipient_key: string;
}

export interface TransferResult {
  id: string;
  status: string;
  fee: number;
  amount_sent: number;
  amount_received: number;
  estimated_arrival: string;
}
