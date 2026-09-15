/**
 * PIX key validation. A PIX key is one of five kinds:
 * CPF, CNPJ, e-mail, phone (E.164, +55...), or a random UUID (EVP).
 */
import { onlyDigits, isValidCPF, isValidCNPJ } from "./document";
import { isValidEmail } from "./email";

export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "evp";

const EVP_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Brazilian phone in E.164: +55 + 2-digit DDD + 8/9-digit number.
const PHONE_E164_RE = /^\+55\d{10,11}$/;

/**
 * Detects the PIX key type, or returns null when the value does not match
 * any valid key format. Validation is format + check-digit level; it does
 * not confirm the key is registered at a PSP.
 */
export function detectPixKeyType(rawValue: string): PixKeyType | null {
  const value = rawValue.trim();
  if (!value) return null;

  if (EVP_RE.test(value)) return "evp";
  if (isValidEmail(value)) return "email";

  const normalizedPhone = value.startsWith("+") ? value : `+55${onlyDigits(value)}`;
  if (PHONE_E164_RE.test(normalizedPhone)) return "phone";

  const digits = onlyDigits(value);
  if (digits.length === 11 && isValidCPF(digits)) return "cpf";
  if (digits.length === 14 && isValidCNPJ(digits)) return "cnpj";

  return null;
}

export function isValidPixKey(value: string): boolean {
  return detectPixKeyType(value) !== null;
}

/** Backend PIX key type enum (RequestPixWithdrawalDto.pixKeyType). */
export type BackendPixKeyType = "CPF_CNPJ" | "EMAIL" | "PHONE" | "RANDOM";

/** Maps a detected key type to the enum the backend withdrawal endpoint expects. */
export function toBackendPixKeyType(type: PixKeyType): BackendPixKeyType {
  switch (type) {
    case "cpf":
    case "cnpj":
      return "CPF_CNPJ";
    case "email":
      return "EMAIL";
    case "phone":
      return "PHONE";
    case "evp":
      return "RANDOM";
  }
}

/**
 * Normalizes a PIX key to the canonical form a PSP expects:
 * phones become E.164 (+55...), documents become bare digits,
 * e-mails are lower-cased, EVP/UUID is lower-cased.
 */
export function normalizePixKey(rawValue: string): string {
  const value = rawValue.trim();
  const type = detectPixKeyType(value);
  switch (type) {
    case "phone":
      return value.startsWith("+") ? value : `+55${onlyDigits(value)}`;
    case "cpf":
    case "cnpj":
      return onlyDigits(value);
    case "email":
    case "evp":
      return value.toLowerCase();
    default:
      return value;
  }
}
