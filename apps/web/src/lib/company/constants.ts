export const COMPANY_TABS = [
  "perfil",
  "documentos",
  "pendencias",
  "limites",
] as const;

export type CompanyTab = (typeof COMPANY_TABS)[number];

/** Real backend enum values from `OnboardingController` (`POST /v1/onboarding/documents/:type`). */
export const BACKEND_KYB_DOCUMENT_TYPES = [
  "CONTRATO_SOCIAL",
  "CARTAO_CNPJ",
  "DOCUMENTO_SOCIO",
  "COMPROVANTE_ENDERECO",
  "FATURAMENTO",
] as const;

export type BackendKybDocumentType = (typeof BACKEND_KYB_DOCUMENT_TYPES)[number];

export const BACKEND_KYB_DOCUMENT_TYPE_SET = new Set<string>(
  BACKEND_KYB_DOCUMENT_TYPES,
);

export const COMPANY_DOCUMENT_META: Record<
  BackendKybDocumentType,
  { name: string; category: string }
> = {
  CONTRATO_SOCIAL: {
    name: "Contrato Social Consolidado",
    category: "Cadastro societário",
  },
  CARTAO_CNPJ: {
    name: "Cartão CNPJ e Quadro de Sócios",
    category: "Cadastro societário",
  },
  DOCUMENTO_SOCIO: {
    name: "Documento de Identidade dos Sócios",
    category: "Identificação de representantes",
  },
  COMPROVANTE_ENDERECO: {
    name: "Comprovante de Endereço Comercial",
    category: "Cadastro societário",
  },
  FATURAMENTO: {
    name: "Balanço Patrimonial / DRE (Último Exercício)",
    category: "Demonstrações financeiras",
  },
};

/** Upload constraints matching `bravachain-api` (`OnboardingService`). */
export const COMPANY_DOC_ALLOWED_MIMES = new Set<string>([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const COMPANY_DOC_ACCEPT = "application/pdf,image/jpeg,image/png";
export const COMPANY_DOC_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Canonical row order for the Avenia limits table. */
export const COMPANY_LIMIT_SCOPES = ["GLOBAL", "BRL", "USD", "EUR"] as const;
export type CompanyLimitScope = (typeof COMPANY_LIMIT_SCOPES)[number];

/** Taupe progress bar color required by the Empresa limits specification. */
export const COMPANY_LIMIT_PROGRESS_COLOR = "#B5AAA6";
