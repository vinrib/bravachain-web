import { onlyDigits } from "../validation/document";

/** Masks a CPF as 000.000.000-00, progressively as the user types. */
export function formatCPF(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

/** Masks a CNPJ as 00.000.000/0000-00, progressively as the user types. */
export function formatCNPJ(value: string): string {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

/** Masks whichever of CPF/CNPJ the digit count implies. */
export function formatCpfCnpj(value: string): string {
  return onlyDigits(value).length > 11 ? formatCNPJ(value) : formatCPF(value);
}
