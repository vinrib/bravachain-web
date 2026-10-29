/**
 * Pure formatting helpers for the admin screens. No i18n here — human labels for
 * enums live in the locale files and are resolved in the components.
 */

/** Keeps only digits. */
export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Formats an 11-digit CPF as 123.456.789-01; returns the input if not 11 digits. */
export function formatCpf(cpf: string | null | undefined): string {
  const d = digitsOnly(cpf);
  if (d.length !== 11) return (cpf ?? "").trim();
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Structural CPF validity (Receita Federal mod-11), mirroring the backend
 * `isValidCpf` so the owner form can reject bad input before calling the API.
 * Pure check — no external list. Rejects the all-same-digit runs.
 */
export function isValidCpf(cpf: string | null | undefined): boolean {
  const d = digitsOnly(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  for (let check = 9; check < 11; check++) {
    let sum = 0;
    for (let i = 0; i < check; i++) sum += Number(d[i]) * (check + 1 - i);
    let verifier = (sum * 10) % 11;
    if (verifier === 10) verifier = 0;
    if (verifier !== Number(d[check])) return false;
  }
  return true;
}

/** Formats a 14-digit CNPJ as 00.000.000/0001-00; returns input if already formatted. */
export function formatCnpj(cnpj: string | null | undefined): string {
  const d = digitsOnly(cnpj);
  if (d.length !== 14) return (cnpj ?? "").trim();
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** pt-BR date-time, e.g. "27/10/2026 09:12". Empty string for null/invalid. */
export function formatDateTimeBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** pt-BR date, e.g. "27/10/2026". Empty string for null/invalid. */
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** BRL currency, e.g. "R$ 18.400.000,00". null-safe → "". */
export function formatBrl(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
