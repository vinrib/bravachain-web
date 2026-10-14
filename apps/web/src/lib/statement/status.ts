/**
 * Maps a statement row's raw `status` to the design's four etiquetas and a tone,
 * and decides which tab it belongs to (Em andamento vs Histórico). The exact
 * backend status strings for /v1/statement aren't enumerated in the contract we
 * have, so this matches by substring (uppercased) — tolerant, never inventing a
 * value. Unknown statuses fall back to a neutral pill in "Em andamento".
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

  if (/FAIL|EXPIR|CANCEL|REJECT|ERROR/.test(s)) {
    return { label: "Falhou", tone: "error", final: true };
  }
  if (/COMPLET|CONCLU|SETTLED|DONE|PAID|SUCCESS/.test(s)) {
    return { label: "Concluído", tone: "success", final: true };
  }
  if (/HOLD|VERIF|REVIEW|HELD|PENDING_REVIEW|ANALYS/.test(s)) {
    return { label: "Em verificação", tone: "review", final: false };
  }
  if (/PEND|PROC|CONFIRM|DELIVER|HOP|PROCESSING|DEPOSIT/.test(s)) {
    return { label: "Em processamento", tone: "processing", final: false };
  }
  // Unknown → show the raw value, keep it in "Em andamento".
  return { label: raw || "—", tone: "neutral", final: false };
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
