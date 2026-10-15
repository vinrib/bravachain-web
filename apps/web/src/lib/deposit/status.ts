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

/** mm:ss countdown label. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
