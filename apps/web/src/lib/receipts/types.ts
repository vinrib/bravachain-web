/**
 * Types for GET /v1/receipts (PIX withdrawal receipts — only COMPLETED ones).
 * List keys confirmed against the backend (main); the list is `receipts`.
 * Decimal values may arrive as string. The rich detail (/v1/receipts/:id) is
 * intentionally not modeled here yet — the official comprovante is the PDF.
 */
export interface ReceiptListItem {
  id: string;
  protocol: string;
  amountBrl: number;
  pixKey: string;
  bankName: string | null;
  pixSentAt: string;
  createdAt: string;
}

export interface ReceiptsSummary {
  totalWithdrawn30d: number;
  withdrawalCount30d: number;
}

export interface ReceiptsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReceiptsResponse {
  summary: ReceiptsSummary;
  receipts: ReceiptListItem[];
  pagination: ReceiptsPagination;
}

export interface SendReceiptEmailResponse {
  sent: boolean;
  recipientEmail: string;
}

export interface ReceiptsQuery {
  page?: number;
  limit?: number;
}
