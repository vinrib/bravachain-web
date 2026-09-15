/**
 * One-shot handoff of the Avenia verification links from signup to the
 * verification screen. The signup response already contains the links; we stash
 * them in sessionStorage so `/cadastro` can show them immediately after the
 * redirect, without an extra round-trip. Consumed once, then cleared.
 */
export const KYB_LINKS_STORAGE_KEY = "bc_kyb_links";

export interface KybLinksHandoff {
  basicCompanyDataUrl?: string | null;
  authorizedRepresentativeUrl?: string | null;
  kycUrl?: string | null;
}

export function consumeKybLinksHandoff(): KybLinksHandoff | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KYB_LINKS_STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KYB_LINKS_STORAGE_KEY);
  try {
    return JSON.parse(raw) as KybLinksHandoff;
  } catch {
    return null;
  }
}
