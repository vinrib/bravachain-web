/**
 * View models + normalizers, reconciled with the backend OpenAPI.
 *
 * Money is decimal BRL/BRLA (major units), matching the backend ledger
 * (Prisma Decimal, serialized as string) — NOT centavos. Use `formatMoney`.
 */
import {
  normalizeKycStatus,
  type AccountType,
  type KycStatus,
} from "@bravachain/shared";

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function pick<T = unknown>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T;
  }
  return undefined;
}

// ─── Balance ──────────────────────────────────────────────────────────────
// GET /v1/wallet -> { userId, accounts: [{ id, provider, currency, balance }] }

export interface WalletAccount {
  id: string;
  currency: string;
  /** Decimal balance in major units. */
  balance: number;
  provider?: string;
}

export interface Balance {
  accounts: WalletAccount[];
  /** The BRL account balance (the withdrawable one), or 0. */
  available: number;
  currency: string;
}

export function normalizeBalance(raw: unknown): Balance {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawAccounts = Array.isArray(r.accounts) ? (r.accounts as unknown[]) : [];
  const accounts: WalletAccount[] = rawAccounts.map((a) => {
    const acc = (a ?? {}) as Record<string, unknown>;
    return {
      id: str(pick(acc, "id", "accountId")),
      currency: str(pick(acc, "currency", "currencyCode"), "BRL"),
      balance: num(pick(acc, "balance", "availableBalance", "amount")),
      provider: pick<string>(acc, "provider"),
    };
  });
  // Prefer the BRL account (withdrawable via PIX); fall back to the first.
  const brl = accounts.find((a) => a.currency?.toUpperCase() === "BRL");
  const primary = brl ?? accounts[0];
  return {
    accounts,
    available: primary?.balance ?? 0,
    currency: primary?.currency ?? "BRL",
  };
}

// ─── Transactions (extrato) ─────────────────────────────────────────────────
// GET /v1/wallet/history -> ledger entries
//   { id, type, amount, balanceAfter, referenceType, reference, transactionId, createdAt, asset? }

export type TxDirection = "in" | "out";

export interface Transaction {
  id: string;
  direction: TxDirection;
  description: string;
  /** Decimal amount in major units (always positive; sign is in `direction`). */
  amount: number;
  currency: string;
  createdAt: string;
}

// Human labels for common ledger entry types; unknown types fall back to the raw type.
const LEDGER_TYPE_LABELS: Record<string, string> = {
  CREDIT: "Crédito",
  DEBIT: "Débito",
  DEPOSIT: "Depósito",
  PIX_DEPOSIT: "Depósito PIX",
  WITHDRAWAL: "Saque",
  PIX_WITHDRAWAL: "Saque PIX",
  FEE: "Taxa",
  CONVERSION: "Conversão",
  TRANSFER: "Transferência",
};

const DEBIT_TYPES = /WITHDRAW|DEBIT|FEE|SEND|PAYOUT|OUT/;

export function normalizeTransaction(raw: unknown): Transaction {
  const r = (raw ?? {}) as Record<string, unknown>;
  const type = str(pick(r, "type", "referenceType")).toUpperCase();
  const amount = num(pick(r, "amount", "value"));
  const isDebit = DEBIT_TYPES.test(type) || amount < 0;
  return {
    id: str(pick(r, "id", "transactionId", "uuid"), crypto.randomUUID()),
    direction: isDebit ? "out" : "in",
    description:
      LEDGER_TYPE_LABELS[type] ??
      str(pick(r, "reference", "description", "referenceType", "type"), "Movimentação"),
    amount: Math.abs(amount),
    currency: str(pick(r, "asset", "currency"), "BRL"),
    createdAt: str(pick(r, "createdAt", "created_at", "date"), new Date().toISOString()),
  };
}

export function normalizeTransactions(raw: unknown): Transaction[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.data)
      ? ((raw as Record<string, unknown>).data as unknown[])
      : Array.isArray((raw as Record<string, unknown>)?.entries)
        ? ((raw as Record<string, unknown>).entries as unknown[])
        : Array.isArray((raw as Record<string, unknown>)?.items)
          ? ((raw as Record<string, unknown>).items as unknown[])
          : [];
  return list.map(normalizeTransaction);
}

// ─── KYC / KYB state ─────────────────────────────────────────────────────────
// GET /kyc/status -> { ready, localKycStatus, identityStatus?, ... }  (no links)
// POST /kyc/submit / signup -> Avenia links (kycUrl | basicCompanyDataUrl + authorizedRepresentativeUrl)

export interface KycState {
  accountType: AccountType;
  status: KycStatus;
  kycUrl?: string;
  basicCompanyDataUrl?: string;
  authorizedRepresentativeUrl?: string;
  rejectionReason?: string;
}

export function normalizeKycState(raw: unknown): KycState {
  const r = (raw ?? {}) as Record<string, unknown>;

  const basicCompanyDataUrl = pick<string>(r, "basicCompanyDataUrl", "companyDataUrl");
  const authorizedRepresentativeUrl = pick<string>(
    r,
    "authorizedRepresentativeUrl",
    "representativeUrl",
  );
  const isPJ =
    Boolean(basicCompanyDataUrl || authorizedRepresentativeUrl) ||
    ["PJ", "COMPANY", "BUSINESS"].includes(
      str(pick(r, "accountType", "type", "personType")).toUpperCase(),
    );

  const kycUrl = pick<string>(r, "kycUrl", "url");

  // /kyc/status uses `localKycStatus`; other shapes use `status`.
  // `ready === true` (Avenia readiness) implies fully approved.
  const rawStatus =
    str(pick(r, "localKycStatus", "status", "kycStatus")) ||
    (r.ready === true ? "APPROVED" : "");
  let status = normalizeKycStatus(rawStatus);
  // A response that carries onboarding links (e.g. /kyc/submit) but no explicit
  // status means the verification was generated and is awaiting completion.
  const hasLinks = Boolean(basicCompanyDataUrl || authorizedRepresentativeUrl || kycUrl);
  if (status === "not_started" && hasLinks) status = "pending";

  return {
    accountType: isPJ ? "PJ" : "PF",
    status,
    kycUrl,
    basicCompanyDataUrl,
    authorizedRepresentativeUrl,
    rejectionReason: pick<string>(r, "kybRejectedReason", "rejectionReason", "reason"),
  };
}
