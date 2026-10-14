import type {
  ReceiptListItem,
  ReceiptsResponse,
  ReceiptsSummary,
  ReceiptsPagination,
} from "./types";

function num(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

function numN(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function strN(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeItem(raw: unknown): ReceiptListItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    protocol: str(r.protocol),
    amountBrl: num(r.amountBrl),
    pixKey: str(r.pixKey),
    bankName: strN(r.bankName),
    pixSentAt: str(r.pixSentAt),
    createdAt: str(r.createdAt),
    // Optional — present only if the backend includes them on the list item.
    feeBrl: numN(r.feeBrl),
    netAmountBrl: numN(r.netAmountBrl),
  };
}

function normalizeSummary(raw: unknown): ReceiptsSummary {
  const s = (raw ?? {}) as Record<string, unknown>;
  return {
    totalWithdrawn30d: num(s.totalWithdrawn30d),
    withdrawalCount30d: num(s.withdrawalCount30d),
  };
}

function normalizePagination(raw: unknown, count: number): ReceiptsPagination {
  const p = (raw ?? {}) as Record<string, unknown>;
  return {
    page: num(p.page) || 1,
    limit: num(p.limit) || count || 20,
    total: num(p.total),
    totalPages: num(p.totalPages) || 1,
  };
}

export function normalizeReceipts(raw: unknown): ReceiptsResponse {
  const r = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(r.receipts) ? r.receipts : [];
  const receipts = list.map(normalizeItem);
  return {
    summary: normalizeSummary(r.summary),
    receipts,
    pagination: normalizePagination(r.pagination, receipts.length),
  };
}
