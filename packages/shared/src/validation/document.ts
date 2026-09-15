/**
 * Brazilian document (CPF / CNPJ) validation.
 * Pure functions — no DOM, no Node APIs — so they run unchanged in the
 * Next.js web app and the future React Native app.
 */

/** Strips every non-digit character. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validates a CPF (individual taxpayer registry) using the official
 * check-digit algorithm. Accepts formatted or unformatted input.
 */
export function isValidCPF(input: string): boolean {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11) return false;
  // Reject known invalid sequences (all same digit).
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i]! * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10];
}

/**
 * Validates a CNPJ (company taxpayer registry) using the official
 * check-digit algorithm. Accepts formatted or unformatted input.
 */
export function isValidCNPJ(input: string): boolean {
  const cnpj = onlyDigits(input);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const digits = cnpj.split("").map(Number);

  const checkDigit = (length: number): number => {
    // Weights run 5..2 then 9..2 for the first digit, shifted by one for the second.
    let weight = length - 7;
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i]! * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return checkDigit(12) === digits[12] && checkDigit(13) === digits[13];
}

/** True when the input is a valid CPF or CNPJ. */
export function isValidCpfCnpj(input: string): boolean {
  const len = onlyDigits(input).length;
  if (len === 11) return isValidCPF(input);
  if (len === 14) return isValidCNPJ(input);
  return false;
}
