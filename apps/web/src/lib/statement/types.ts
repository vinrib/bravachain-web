/**
 * Types for GET /v1/statement. Keys confirmed against the backend (main);
 * the list is `transactions`. Decimal values may arrive as string or number —
 * the normalizer coerces them. Only fields that exist in the contract are
 * mapped (null-tolerant), nothing invented.
 */
import type { StatementCategory } from "./category";

export type StatementFilterType = "ALL" | "INBOUND" | "WITHDRAWAL";
export type StatementRowType = "INBOUND" | "WITHDRAWAL";

export interface StatementRow {
  id: string;
  type: StatementRowType;
  /** NEW (PR #56): DEPOSIT|WITHDRAWAL|REVERSAL|ADJUSTMENT. null until it ships. */
  category: StatementCategory | null;
  rail: string | null;
  description: string;
  amountBrl: number;
  amountForeign: number | null;
  foreignCurrency: string | null;
  rateApplied: number | null;
  spread: number | null;
  feeBrl: number | null;
  netAmountBrl: number | null;
  runningBalance: number;
  reference: string | null;
  counterparty: string | null;
  status: string;
  createdAt: string;
  internalId: string;
}

export interface StatementSummary {
  totalInbound: number;
  totalWithdrawn: number;
  /**
   * NEW (PR #56): soma líquida de ajustes e estornos do período. null até o
   * backend enviar — o cartão só aparece quando presente.
   */
  ajustesEEstornos: number | null;
  /**
   * Taxa média enviada pelo backend. null quando não aplicável — exibir "—".
   * Nunca recalculada no front, nunca derivada de rateApplied.
   */
  averageRate: number | null;
  periodStart: string;
  periodEnd: string;
}

export interface StatementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StatementResponse {
  summary: StatementSummary;
  transactions: StatementRow[];
  pagination: StatementPagination;
}

export interface StatementQuery {
  startDate?: string;
  endDate?: string;
  type?: StatementFilterType;
  page?: number;
  limit?: number;
}
