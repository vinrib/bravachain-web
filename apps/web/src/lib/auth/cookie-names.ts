/**
 * Session cookie names. Kept in a runtime-neutral module (no `server-only`,
 * no next/headers) so both the server session helpers and the edge `proxy`
 * can import them.
 */
export const ACCESS_COOKIE = "bc_at";
export const REFRESH_COOKIE = "bc_rt";
