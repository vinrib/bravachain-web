import {
  BACKEND_KYB_DOCUMENT_TYPES,
  BACKEND_KYB_DOCUMENT_TYPE_SET,
  COMPANY_DOCUMENT_META,
  type BackendKybDocumentType,
} from "./constants";
import { COMPANY_COPY } from "./copy";
import { formatCnpj, formatCompanyDateBr, maskCpf } from "./format";
import type {
  AveniaStatusKind,
  CompanyDocument,
  CompanyLimitRow,
  CompanyProfile,
  PepPartner,
  RawBrandingResponse,
  RawLimitCurrency,
  RawLimitsResponse,
  RawMeResponse,
  RawOnboardingStatus,
} from "./types";

// TODO: conectar endpoint real da Avenia para dados cadastrais completos da empresa titular (razão social, forma de constituição, CNPJ, telefone, CNAE e endereço comercial).
const FALLBACK_COMPANY_PROFILE = {
  legalName: "Empresa Exemplo Exportadora Ltda",
  entityType: "LTDA",
  cnpj: "00.000.000/0001-00",
  email: "contato@exemplo.com.br",
  phone: "+55 00 00000-0000",
  cnae: "46.37-1-99 — Comércio atacadista especializado em outros produtos alimentícios",
  address: "Rua Exemplo, 100 — Rio Branco, AC",
} as const;

// TODO: conectar endpoint real da Avenia para listagem e declaração de PEP dos sócios e beneficiários finais (UBOs).
const FALLBACK_PEP_PARTNERS: readonly PepPartner[] = [
  {
    id: "ubo-1",
    name: "Sócio Exemplo A",
    role: "Sócio Administrador",
    cpfMasked: maskCpf("***.000.000-**"),
    ownership: "60%",
    isPep: false,
  },
  {
    id: "ubo-2",
    name: "Sócia Exemplo B",
    role: "Sócia e Diretora Financeira",
    cpfMasked: maskCpf("***.000.000-**"),
    ownership: "40%",
    isPep: false,
  },
];

// TODO: conectar endpoint real da Avenia quando GET /v1/onboarding/status não retornar documentos (ex.: pré-cadastro/Preview).
const FALLBACK_COMPANY_DOCUMENTS: readonly CompanyDocument[] = [
  {
    id: "CONTRATO_SOCIAL",
    apiType: "CONTRATO_SOCIAL",
    name: COMPANY_DOCUMENT_META.CONTRATO_SOCIAL.name,
    category: COMPANY_DOCUMENT_META.CONTRATO_SOCIAL.category,
    fileName: "Contrato_Social_Exemplo.pdf",
    uploadedAtLabel: "12/10/2026",
    status: COMPANY_COPY.documents.status.approved,
  },
  {
    id: "CARTAO_CNPJ",
    apiType: "CARTAO_CNPJ",
    name: COMPANY_DOCUMENT_META.CARTAO_CNPJ.name,
    category: COMPANY_DOCUMENT_META.CARTAO_CNPJ.category,
    fileName: "Cartao_CNPJ_Exemplo.pdf",
    uploadedAtLabel: "12/10/2026",
    status: COMPANY_COPY.documents.status.approved,
  },
  {
    id: "DOCUMENTO_SOCIO",
    apiType: "DOCUMENTO_SOCIO",
    name: COMPANY_DOCUMENT_META.DOCUMENTO_SOCIO.name,
    category: COMPANY_DOCUMENT_META.DOCUMENTO_SOCIO.category,
    fileName: "Documentos_Socios_Exemplo.pdf",
    uploadedAtLabel: "13/10/2026",
    status: COMPANY_COPY.documents.status.approved,
  },
  {
    id: "COMPROVANTE_ENDERECO",
    apiType: "COMPROVANTE_ENDERECO",
    name: COMPANY_DOCUMENT_META.COMPROVANTE_ENDERECO.name,
    category: COMPANY_DOCUMENT_META.COMPROVANTE_ENDERECO.category,
    fileName: "Comprovante_Endereco_Exemplo.pdf",
    uploadedAtLabel: "15/10/2026",
    status: COMPANY_COPY.documents.status.approved,
  },
  {
    id: "FATURAMENTO",
    apiType: "FATURAMENTO",
    name: COMPANY_DOCUMENT_META.FATURAMENTO.name,
    category: COMPANY_DOCUMENT_META.FATURAMENTO.category,
    fileName: null,
    uploadedAtLabel: null,
    status: COMPANY_COPY.documents.status.pending,
  },
];

// TODO: conectar endpoint real da Avenia quando GET /v1/limits retornar indisponível (403/avenia: null) ou não trouxer alguma das moedas.
const FALLBACK_COMPANY_LIMITS: readonly CompanyLimitRow[] = [
  {
    id: "GLOBAL",
    scope: "GLOBAL",
    label: COMPANY_COPY.limits.globalLabel,
    isGlobal: true,
    entry: { used: 42500, max: 100000, unit: "USD" },
    exit: { used: 12000, max: 100000, unit: "USD" },
  },
  {
    id: "BRL",
    scope: "BRL",
    label: "BRL",
    isGlobal: false,
    entry: { used: 65000, max: 250000, unit: "BRL" },
    exit: { used: 68900, max: 250000, unit: "BRL" },
  },
  {
    id: "USD",
    scope: "USD",
    label: "USD",
    isGlobal: false,
    entry: { used: 42500, max: 100000, unit: "USD" },
    exit: { used: 12000, max: 100000, unit: "USD" },
  },
  {
    id: "EUR",
    scope: "EUR",
    label: "EUR",
    isGlobal: false,
    entry: { used: 18200, max: 80000, unit: "EUR" },
    exit: { used: 0, max: 80000, unit: "EUR" },
  },
];

export function resolveAveniaStatus(
  onboarding: RawOnboardingStatus | null,
): { kind: AveniaStatusKind; label: string } {
  if (!onboarding) {
    // TODO: conectar endpoint real da Avenia quando o status de onboarding não estiver disponível.
    return {
      kind: "approved",
      label: COMPANY_COPY.aveniaStatus.approved,
    };
  }

  switch (onboarding.kybStatus) {
    case "APPROVED":
      return {
        kind: "approved",
        label: COMPANY_COPY.aveniaStatus.approved,
      };
    case "SUBMITTED":
      return {
        kind: "in_analysis",
        label: COMPANY_COPY.aveniaStatus.inAnalysis,
      };
    case "PENDING":
    case "RESUBMIT":
    case "REJECTED":
    default:
      return {
        kind: "pending",
        label: COMPANY_COPY.aveniaStatus.pending,
      };
  }
}

export function buildCompanyProfile(input: {
  me: RawMeResponse | null;
  branding: RawBrandingResponse | null;
  onboarding: RawOnboardingStatus | null;
}): CompanyProfile {
  const status = resolveAveniaStatus(input.onboarding);

  // TODO: conectar endpoint real da Avenia para preencher forma de constituição, CNPJ, telefone, CNAE e endereço comercial.
  const legalName =
    input.branding?.companyDisplayName ??
    input.me?.name ??
    FALLBACK_COMPANY_PROFILE.legalName;

  const email = input.me?.email ?? FALLBACK_COMPANY_PROFILE.email;

  return {
    legalName,
    entityType: FALLBACK_COMPANY_PROFILE.entityType,
    cnpj: formatCnpj(FALLBACK_COMPANY_PROFILE.cnpj),
    email,
    phone: FALLBACK_COMPANY_PROFILE.phone,
    cnae: FALLBACK_COMPANY_PROFILE.cnae,
    address: FALLBACK_COMPANY_PROFILE.address,
    aveniaStatusKind: status.kind,
    aveniaStatusLabel: status.label,
    usesFallbackFields: true,
  };
}

export function getInitialPepPartners(): PepPartner[] {
  // TODO: conectar endpoint real da Avenia para carregar sócios e beneficiários finais (UBOs).
  return FALLBACK_PEP_PARTNERS.map((partner) => ({ ...partner }));
}

function humanizeUnknownDocType(type: string): string {
  const cleaned = type.replace(/[_-]+/g, " ").trim().toLowerCase();
  if (!cleaned) return "Documento";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function buildCompanyDocuments(
  onboarding: RawOnboardingStatus | null,
): CompanyDocument[] {
  if (!onboarding) {
    return FALLBACK_COMPANY_DOCUMENTS.map((doc) => ({ ...doc }));
  }

  const uploadedByType = new Map(
    onboarding.documents.map((doc) => [doc.type.toUpperCase(), doc]),
  );
  const missingSet = new Set(
    onboarding.missingDocuments.map((type) => type.toUpperCase()),
  );

  // Preserve canonical order of the 5 backend KYB document types, plus any extra returned by the backend.
  const orderedTypes: string[] = [...BACKEND_KYB_DOCUMENT_TYPES];
  for (const doc of onboarding.documents) {
    const key = doc.type.toUpperCase();
    if (!orderedTypes.includes(key)) orderedTypes.push(key);
  }
  for (const missingType of onboarding.missingDocuments) {
    const key = missingType.toUpperCase();
    if (!orderedTypes.includes(key)) orderedTypes.push(key);
  }

  const isKybApproved = onboarding.kybStatus === "APPROVED";

  return orderedTypes.map((typeKey) => {
    const isKnown = BACKEND_KYB_DOCUMENT_TYPE_SET.has(typeKey);
    const meta = isKnown
      ? COMPANY_DOCUMENT_META[typeKey as BackendKybDocumentType]
      : {
          name: humanizeUnknownDocType(typeKey),
          category: "Cadastro societário",
        };

    const uploaded = uploadedByType.get(typeKey);
    if (uploaded && !missingSet.has(typeKey)) {
      return {
        id: uploaded.id,
        apiType: isKnown ? (typeKey as BackendKybDocumentType) : null,
        name: meta.name,
        category: meta.category,
        fileName: uploaded.fileName,
        uploadedAtLabel: uploaded.uploadedAt
          ? formatCompanyDateBr(uploaded.uploadedAt)
          : null,
        // Only Avenia approval (`kybStatus === "APPROVED"`) marks documents as approved.
        status: isKybApproved
          ? COMPANY_COPY.documents.status.approved
          : COMPANY_COPY.documents.status.inAnalysis,
      };
    }

    return {
      id: typeKey,
      apiType: isKnown ? (typeKey as BackendKybDocumentType) : null,
      name: meta.name,
      category: meta.category,
      fileName: null,
      uploadedAtLabel: null,
      status: COMPANY_COPY.documents.status.pending,
    };
  });
}

function findRawCurrency(
  byCurrency: RawLimitCurrency[],
  scope: "GLOBAL" | "BRL" | "USD" | "EUR",
): RawLimitCurrency | undefined {
  if (scope === "GLOBAL") {
    return byCurrency.find(
      (c) => c.currency === "*" || c.currency === "GLOBAL",
    );
  }
  return byCurrency.find((c) => c.currency === scope);
}

export function buildCompanyLimits(
  limitsResponse: RawLimitsResponse | null,
): CompanyLimitRow[] {
  const byCurrency = limitsResponse?.avenia?.byCurrency ?? [];

  if (byCurrency.length === 0) {
    // TODO: conectar endpoint real da Avenia quando o cliente ainda não possuir subconta ou limites retornados por GET /v1/limits.
    return FALLBACK_COMPANY_LIMITS.map((row) => ({
      ...row,
      entry: { ...row.entry },
      exit: { ...row.exit },
    }));
  }

  return FALLBACK_COMPANY_LIMITS.map((fallbackRow) => {
    const raw = findRawCurrency(byCurrency, fallbackRow.scope);
    if (!raw) {
      // TODO: conectar endpoint real da Avenia para moedas ainda não presentes em GET /v1/limits.
      return {
        ...fallbackRow,
        entry: { ...fallbackRow.entry },
        exit: { ...fallbackRow.exit },
      };
    }

    const entryMax = raw.fiatIn.max ?? raw.chainIn.max;
    const entryUsed = raw.fiatIn.used ?? raw.chainIn.used ?? 0;
    const exitMax = raw.fiatOut.max ?? raw.chainOut.max;
    const exitUsed = raw.fiatOut.used ?? raw.chainOut.used ?? 0;
    const unit = fallbackRow.isGlobal ? "USD" : fallbackRow.scope;

    return {
      id: fallbackRow.id,
      scope: fallbackRow.scope,
      label: fallbackRow.label,
      isGlobal: fallbackRow.isGlobal,
      entry:
        entryMax !== null
          ? { used: entryUsed, max: entryMax, unit }
          : { ...fallbackRow.entry },
      exit:
        exitMax !== null
          ? { used: exitUsed, max: exitMax, unit }
          : { ...fallbackRow.exit },
    };
  });
}
