import type {
  StatementResponse,
  StatementRow,
  StatementRowType,
  StatementSummary,
  StatementPagination,
} from "./types";
import { parseCategory } from "./category";

/** Coerce a Decimal-as-string | number | null into a number (0 fallback). */
function num(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

/** Nullable numeric: keeps null, coerces strings, drops NaN to null. */
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

function normalizeRow(raw: unknown): StatementRow {
  const r = (raw ?? {}) as Record<string, unknown>;
  const type: StatementRowType = r.type === "WITHDRAWAL" ? "WITHDRAWAL" : "INBOUND";
  return {
    id: str(r.id),
    type,
    category: parseCategory(r.category),
    rail: strN(r.rail),
    description: str(r.description),
    amountBrl: num(r.amountBrl),
    amountForeign: numN(r.amountForeign),
    foreignCurrency: strN(r.foreignCurrency),
    rateApplied: numN(r.rateApplied),
    spread: numN(r.spread),
    feeBrl: numN(r.feeBrl),
    netAmountBrl: numN(r.netAmountBrl),
    runningBalance: num(r.runningBalance),
    reference: strN(r.reference),
    counterparty: strN(r.counterparty),
    status: str(r.status),
    createdAt: str(r.createdAt),
    internalId: str(r.internalId),
  };
}

function normalizeSummary(raw: unknown): StatementSummary {
  const s = (raw ?? {}) as Record<string, unknown>;
  return {
    totalInbound: num(s.totalInbound),
    totalWithdrawn: num(s.totalWithdrawn),
    // NEW optional fields — null until the backend sends them (PR #56).
    ajustesEEstornos: numN(s.ajustesEEstornos),
    averageRate: numN(s.averageRate),
    periodStart: str(s.periodStart),
    periodEnd: str(s.periodEnd),
  };
}

function normalizePagination(raw: unknown, rowCount: number): StatementPagination {
  const p = (raw ?? {}) as Record<string, unknown>;
  const page = num(p.page) || 1;
  const limit = num(p.limit) || rowCount || 20;
  const total = num(p.total);
  const totalPages = num(p.totalPages) || 1;
  return { page, limit, total, totalPages };
}

export function normalizeStatement(raw: unknown): StatementResponse {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(r.transactions) ? r.transactions : [];
  const transactions = rows.map(normalizeRow);
  return {
    summary: normalizeSummary(r.summary),
    transactions,
    pagination: normalizePagination(r.pagination, transactions.length),
  };
}
