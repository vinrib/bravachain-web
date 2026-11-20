/**
 * Registration form schemas, masks and validators for each beneficiary rail
 * (BRL Pix, BRL bank account, USD Wire, EUR SEPA). Ported from the design
 * prototype. Field labels/placeholders/hints and validation messages are i18n
 * KEYS (resolved under the `enviar` namespace by the component), so the forms
 * are fully translatable; bank names stay as-is (proper nouns).
 *
 * No "our" minimum/maximum is validated here — only field shape. Avenia-side
 * refusals are surfaced separately as "A Avenia informou: …".
 */
import type { BeneficiaryFormKind } from "./types";

const onlyDigits = (s: string): string => String(s ?? "").replace(/\D/g, "");

export type MaskName = "doc" | "d4" | "d5" | "d9" | "d17" | "iban" | "bic";

/** Input masks (display formatting only). */
export const MASKS: Record<MaskName, (v: string) => string> = {
  doc: (v) => {
    const d = onlyDigits(v).slice(0, 14);
    return d.length <= 11
      ? d
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      : d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5");
  },
  d4: (v) => onlyDigits(v).slice(0, 4),
  d5: (v) => onlyDigits(v).slice(0, 5),
  d9: (v) => onlyDigits(v).slice(0, 9),
  d17: (v) => onlyDigits(v).slice(0, 17),
  iban: (v) =>
    v
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 34)
      .replace(/(.{4})/g, "$1 ")
      .trim(),
  bic: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11),
};

export type ValidatorName = "pixKey" | "cpfCnpj" | "aba" | "iban" | "bic";

/** Error message i18n keys (under `enviar.formErr.*`). */
export const ERR = {
  required: "formErr.required",
  cpfCnpj: "formErr.cpfCnpj",
  email: "formErr.email",
  phone: "formErr.phone",
  randomKey: "formErr.randomKey",
  aba: "formErr.aba",
  iban: "formErr.iban",
  bic: "formErr.bic",
} as const;

/**
 * Field-shape validators. Return `null` when valid, or an i18n key for the
 * error message. `pixKey` depends on the sibling "key type" value.
 */
const VALIDATORS: Record<ValidatorName, (value: string, values: Record<string, string>) => string | null> = {
  pixKey: (value, values) => {
    const type = values.tk || "CPF/CNPJ";
    const digits = onlyDigits(value);
    if (type === "E-mail") return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? null : ERR.email;
    if (type === "Telefone") return digits.length >= 10 && digits.length <= 11 ? null : ERR.phone;
    if (type === "Aleatória")
      return value.replace(/-/g, "").length === 32 ? null : ERR.randomKey;
    return digits.length === 11 || digits.length === 14 ? null : ERR.cpfCnpj;
  },
  cpfCnpj: (value) => {
    const d = onlyDigits(value);
    return d.length === 11 || d.length === 14 ? null : ERR.cpfCnpj;
  },
  aba: (value) => (onlyDigits(value).length === 9 ? null : ERR.aba),
  iban: (value) =>
    /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(value.replace(/\s/g, "")) ? null : ERR.iban,
  bic: (value) =>
    !value || /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value) ? null : ERR.bic,
};

/** One form field (or a section header when `section` is set). */
export interface FieldDef {
  /** Section header: renders a divider + title, no input. */
  section?: string;
  id?: string;
  labelKey?: string;
  /** "opcional" / "quando pedido" suffix key. */
  optionalKey?: string;
  type?: "text" | "select" | "chips";
  placeholderKey?: string;
  hintKey?: string;
  mask?: MaskName;
  validate?: ValidatorName;
  required?: boolean;
  inputMode?: "text" | "numeric";
  mono?: boolean;
  fullWidth?: boolean;
  /** Static option VALUES for select/chips (not translated: bank names, keys). */
  options?: string[];
  /** Option LABEL keys for selects whose options are translatable (countries). */
  optionLabelKeys?: string[];
}

const NICKNAME: FieldDef = {
  id: "ap",
  labelKey: "form.nickname",
  optionalKey: "form.optional",
  placeholderKey: "form.nicknamePh",
};

export const FORMS: Record<BeneficiaryFormKind, FieldDef[]> = {
  pix: [
    NICKNAME,
    { id: "nm", labelKey: "form.nameCompany", required: true },
    {
      id: "tk",
      labelKey: "form.pixKeyType",
      type: "chips",
      options: ["CPF/CNPJ", "E-mail", "Telefone", "Aleatória"],
      fullWidth: true,
    },
    { id: "ch", labelKey: "form.pixKey", required: true, validate: "pixKey", fullWidth: true },
  ],
  conta: [
    NICKNAME,
    { id: "nm", labelKey: "form.nameCompany", required: true },
    {
      id: "doc",
      labelKey: "form.cpfCnpj",
      placeholderKey: "form.cpfCnpjPh",
      required: true,
      mask: "doc",
      validate: "cpfCnpj",
      inputMode: "numeric",
      mono: true,
    },
    {
      id: "bc",
      labelKey: "form.bank",
      type: "select",
      options: [
        "001 — Banco do Brasil",
        "237 — Bradesco",
        "341 — Itaú Unibanco",
        "104 — Caixa",
        "260 — Nu Pagamentos",
      ],
    },
    {
      id: "ag",
      labelKey: "form.agency",
      placeholderKey: "form.agencyPh",
      required: true,
      mask: "d4",
      inputMode: "numeric",
      mono: true,
    },
    {
      id: "cc",
      labelKey: "form.account",
      placeholderKey: "form.accountPh",
      required: true,
      inputMode: "numeric",
      mono: true,
    },
    {
      id: "tc",
      labelKey: "form.accountType",
      type: "chips",
      options: ["Corrente", "Poupança", "Pagamento"],
      fullWidth: true,
    },
  ],
  USD: [
    NICKNAME,
    { id: "nm", labelKey: "form.nameRecipientFull", required: true },
    { section: "form.secBank" },
    {
      id: "bk",
      labelKey: "form.bankName",
      placeholderKey: "form.bankNamePh",
      required: true,
      fullWidth: true,
    },
    {
      id: "rt",
      labelKey: "form.aba",
      placeholderKey: "form.abaPh",
      hintKey: "form.abaHint",
      required: true,
      mask: "d9",
      validate: "aba",
      inputMode: "numeric",
      mono: true,
    },
    {
      id: "ac",
      labelKey: "form.accountNumber",
      required: true,
      mask: "d17",
      inputMode: "numeric",
      mono: true,
    },
    { section: "form.secAddress" },
    { id: "rua", labelKey: "form.street", required: true, fullWidth: true },
    { id: "cid", labelKey: "form.city", required: true },
    { id: "uf", labelKey: "form.state", placeholderKey: "form.statePh", required: true },
    {
      id: "zip",
      labelKey: "form.zipUs",
      placeholderKey: "form.zipUsPh",
      required: true,
      mask: "d5",
      inputMode: "numeric",
      mono: true,
    },
    {
      id: "pais",
      labelKey: "form.country",
      type: "select",
      options: ["US"],
      optionLabelKeys: ["form.countryUS"],
    },
  ],
  EUR: [
    NICKNAME,
    { id: "nm", labelKey: "form.nameRecipient", required: true },
    { section: "form.secBank" },
    {
      id: "iban",
      labelKey: "form.iban",
      placeholderKey: "form.ibanPh",
      required: true,
      mask: "iban",
      validate: "iban",
      mono: true,
      fullWidth: true,
    },
    {
      id: "bic",
      labelKey: "form.bic",
      optionalKey: "form.whenRequested",
      placeholderKey: "form.bicPh",
      mask: "bic",
      validate: "bic",
      mono: true,
    },
    { id: "bk", labelKey: "form.bankName", required: true },
    { section: "form.secAddress" },
    {
      id: "pais",
      labelKey: "form.country",
      type: "select",
      options: ["DE", "FR", "ES", "IT", "NL", "PT"],
      optionLabelKeys: [
        "form.countryDE",
        "form.countryFR",
        "form.countryES",
        "form.countryIT",
        "form.countryNL",
        "form.countryPT",
      ],
    },
    { id: "cid", labelKey: "form.city", required: true },
    { id: "rua", labelKey: "form.street", required: true, fullWidth: true },
    { id: "zip", labelKey: "form.postalCode", required: true, mono: true },
  ],
};

/** Title key per form kind. */
export const FORM_TITLE_KEY: Record<BeneficiaryFormKind, string> = {
  pix: "form.titlePix",
  conta: "form.titleConta",
  USD: "form.titleUsd",
  EUR: "form.titleEur",
};

/** Validate one field; returns an error i18n key or null. */
export function validateField(field: FieldDef, values: Record<string, string>): string | null {
  if (!field.id) return null;
  const value = (values[field.id] ?? "").trim();
  if (field.required && !value) return ERR.required;
  if (field.validate && value) return VALIDATORS[field.validate](value, values);
  return null;
}

/** All field errors for a form kind, keyed by field id. */
export function validateForm(
  kind: BeneficiaryFormKind,
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of FORMS[kind]) {
    const err = validateField(field, values);
    if (err && field.id) errors[field.id] = err;
  }
  return errors;
}
