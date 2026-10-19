import type { DepositUiStatus } from "./types";

/**
 * Maps the backend Transaction.status to a UI state (exact enum, no substrings):
 *   PENDING -> waiting · COMPLETED -> paid · FAILED/CANCELLED -> failed
 * Any other value is treated as waiting and logged in development.
 *
 * NOTE: "expired" is NOT a server status — the server keeps PENDING after the
 * due date. Expiry is computed on the client (see isExpired) and only matters
 * while the status is still PENDING.
 */
export function depositUiStatus(raw: string): DepositUiStatus {
  switch (raw) {
    case "PENDING":
      return "waiting";
    case "COMPLETED":
      return "paid";
    case "FAILED":
    case "CANCELLED":
      return "failed";
    default:
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[deposito] unknown PIX status: ${JSON.stringify(raw)}`);
      }
      return "waiting";
  }
}

export function isFinalStatus(ui: DepositUiStatus): boolean {
  return ui === "paid" || ui === "failed";
}

/**
 * Client-side expiry: true only when there IS an expiresAt, it has passed, and
 * the deposit is still waiting (PENDING). Empty/invalid expiresAt → never expired.
 */
export function isExpired(
  expiresAt: string | null,
  ui: DepositUiStatus,
  now: number = Date.now(),
): boolean {
  if (ui !== "waiting") return false;
  if (!expiresAt) return false;
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return false;
  return now > end;
}

/** Seconds remaining until `expiresAt` (ISO), clamped at 0; null when absent. */
export function remainingSeconds(
  expiresAt: string | null,
  now: number = Date.now(),
): number | null {
  if (!expiresAt) return null;
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.round((end - now) / 1000));
}

/**
 * Countdown label that scales to the QR's real validity (~72h), instead of
 * overflowing minutes (the old mm:ss turned 72h into "4319:52"):
 *   >= 24h -> "2d 23h"
 *   >= 1h  -> "1h 05min"
 *   <  1h  -> "05:30" (mm:ss)
 * Clamped at zero; non-finite input (NaN) -> "00:00", so it never shows a
 * negative or NaN value. The unit abbreviations (d/h/min) read the same in
 * PT/EN/ES, so no new i18n keys are needed.
 */
export function formatCountdown(totalSeconds: number): string {
  const s = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3_600);
  const mins = Math.floor((s % 3_600) / 60);
  const secs = s % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${String(mins).padStart(2, "0")}min`;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
