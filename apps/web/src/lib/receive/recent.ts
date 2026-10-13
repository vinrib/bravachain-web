/**
 * "Recent receivings on this device" — a stop-gap while the backend has no
 * listing endpoint for /v1/receive. Stores ONLY identifiers (never financial
 * data); the detail screen always refetches status/instructions from the
 * backend. Clearly a per-browser convenience, not the authoritative list.
 */

const KEY = "bc_recent_receives";
const MAX = 10;

export interface RecentReceive {
  ticketId: string;
  shareToken?: string;
  method: string;
  inputCurrency?: string;
  createdAt: string; // ISO
}

function read(): RecentReceive[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is RecentReceive =>
        !!r && typeof (r as RecentReceive).ticketId === "string",
    );
  } catch {
    return [];
  }
}

export function getRecentReceives(): RecentReceive[] {
  return read();
}

export function addRecentReceive(entry: RecentReceive): void {
  if (typeof window === "undefined") return;
  const next = [entry, ...read().filter((r) => r.ticketId !== entry.ticketId)].slice(
    0,
    MAX,
  );
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage disabled/full — non-fatal; the detail page still works via URL.
  }
}
