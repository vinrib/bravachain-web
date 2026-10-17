/**
 * Types for Depósito PIX (/v1/pix/*). Request body is typed in openapi
 * (PixQrCodeDto: { valor, descricao }); responses are not, so these mirror the
 * fields from the product spec and are normalized defensively.
 */
export interface PixQrCode {
  txid: string;
  valor: number | null;
  descricao: string | null;
  pixCopiaECola: string | null;
  expiresAt: string | null;
  /** Raw backend status string (mapped for display via deposit/status). */
  status: string;
  /**
   * NEW optional fields (may be absent in production). Decimal strings in BRL;
   * displayed only when both are present (see deposit/money).
   */
  estimatedFee: string | null;
  estimatedNetAmount: string | null;
}

export interface PixStatus {
  txid: string;
  status: string;
  /**
   * NEW optional settlement fields (may be absent in production). Decimal
   * strings in BRL; displayed only when the status is confirmed and present.
   */
  requestedAmount: string | null;
  creditedAmount: string | null;
  feeBrl: string | null;
}

/** UI-level deposit state derived from the raw backend status. */
export type DepositUiStatus = "waiting" | "paid" | "expired" | "failed";
