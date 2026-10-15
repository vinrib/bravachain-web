import type { DepositUiStatus } from "./types";

/**
 * Maps a raw backend PIX status to a UI state. The exact backend status enum
 * is NOT in the committed openapi, so this matches by substring (uppercased)
 * rather than hard-coding unverified names. An unknown status keeps the UI in
 * "waiting" (non-final) so we never claim a payment confirmed/failed wrongly —
 * the exact enum should be pinned once confirmed.
 */
export function depositUiStatus(raw: string): DepositUiStatus {
  const s = (raw || "").toUpperCase();
  if (/PAID|CONFIRM|COMPLET|APPROV|SUCCESS|LIQUID|RECEIV|SETTLED/.test(s)) return "paid";
  if (/EXPIR/.test(s)) return "expired";
  if (/FAIL|ERROR|REJECT|CANCEL|DENIED/.test(s)) return "failed";
  // PENDING / WAITING / CREATED / PROCESSING / ACTIVE / unknown → keep waiting.
  return "waiting";
}

export function isFinalStatus(ui: DepositUiStatus): boolean {
  return ui === "paid" || ui === "expired" || ui === "failed";
}

/** Seconds remaining until `expiresAt` (ISO), clamped at 0. */
export function remainingSeconds(expiresAt: string | null, now: number = Date.now()): number {
  if (!expiresAt) return 0;
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - now) / 1000));
}

/** mm:ss countdown label. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
