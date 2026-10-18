/**
 * Maps a statement row's raw `status` to a label + tone, and decides which tab
 * it belongs to. PR #56 defines an exact enum (COMPLETED | PROCESSING | PENDING
 * | FAILED): only PROCESSING/PENDING stay in "Em andamento"; everything else
 * (incl. COMPLETED/FAILED) goes to "Histórico". We still accept the older,
 * pre-PR#56 status strings by substring so nothing breaks before it ships.
 *
 * A concluded row must never show an empty status ("—"): an empty/unknown
 * status falls back to the generic "Concluído" label in Histórico.
 */
export type StatusTone = "processing" | "success" | "error" | "review" | "neutral";

export interface StatusView {
  label: string;
  tone: StatusTone;
  /** true → Histórico tab; false → Em andamento tab. */
  final: boolean;
}

export function statementStatusView(raw: string): StatusView {
  const s = (raw || "").toUpperCase();

  // Exact enum (PR #56).
  switch (s) {
    case "COMPLETED":
      return { label: "Concluído", tone: "success", final: true };
    case "FAILED":
      return { label: "Falhou", tone: "error", final: true };
    case "PROCESSING":
      return { label: "Em processamento", tone: "processing", final: false };
    case "PENDING":
      return { label: "Em análise", tone: "review", final: false };
  }

  // Backward-compatible substring handling for pre-PR#56 statuses.
  if (/FAIL|EXPIR|CANCEL|REJECT|ERROR/.test(s)) {
    return { label: "Falhou", tone: "error", final: true };
  }
  if (/COMPLET|CONCLU|SETTLED|DONE|PAID|SUCCESS/.test(s)) {
    return { label: "Concluído", tone: "success", final: true };
  }
  if (/HOLD|VERIF|REVIEW|HELD|ANALYS/.test(s)) {
    return { label: "Em análise", tone: "review", final: false };
  }
  if (/PEND|PROC|CONFIRM|DELIVER|HOP|DEPOSIT/.test(s)) {
    return { label: "Em processamento", tone: "processing", final: false };
  }

  // Empty/unknown → generic concluded label, never "—"; keep it in Histórico.
  return { label: "Concluído", tone: "neutral", final: true };
}

const TONE_CLASS: Record<StatusTone, string> = {
  processing: "bg-[#fbf0df] text-[#8a5310] dark:bg-[#c77a18]/15 dark:text-[#d79a3a]",
  review: "bg-[#f6e3e0] text-[#b03030] dark:bg-[#b03030]/15 dark:text-[#e07a7a]",
  success: "bg-[#e4f4ec] text-[#0b6b4f] dark:bg-[#12a46b]/15 dark:text-[#7be0b0]",
  error: "bg-[#f6e3e0] text-[#b03030] dark:bg-[#b03030]/15 dark:text-[#e07a7a]",
  neutral: "bg-muted text-muted-foreground",
};

const DOT_CLASS: Record<StatusTone, string> = {
  processing: "bg-[#c77a18]",
  review: "bg-[#b03030]",
  success: "bg-[#12a46b]",
  error: "bg-[#b03030]",
  neutral: "bg-muted-foreground",
};

export function statusClasses(tone: StatusTone) {
  return { pill: TONE_CLASS[tone], dot: DOT_CLASS[tone] };
}
