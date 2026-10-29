/**
 * In-memory handoff of a client's display identity (company name + CNPJ) from
 * the list row to the review screen.
 *
 * The backend review-detail endpoint (`GET /v1/admin/compliance/clients/:userId`)
 * does NOT return companyName/companyCnpj — only the list does. Rather than put
 * them in the URL, the list seeds this module-level cache on navigation and the
 * review header reads it. It is purely cosmetic: on a hard refresh/deep-link the
 * cache is empty and the header falls back to "—" (never invents data). Cleared
 * naturally on full reload; holds nothing sensitive (company name/CNPJ only).
 */

export interface ClientIdentity {
  companyName: string | null;
  companyCnpj: string | null;
}

const cache = new Map<string, ClientIdentity>();

export function rememberClientIdentity(userId: string, identity: ClientIdentity): void {
  if (userId) cache.set(userId, identity);
}

export function recallClientIdentity(userId: string): ClientIdentity | null {
  return cache.get(userId) ?? null;
}
