import {
  BACKEND_KYB_DOCUMENT_TYPES,
  BACKEND_KYB_DOCUMENT_TYPE_SET,
  COMPANY_DOC_ALLOWED_MIMES,
  COMPANY_DOC_MAX_BYTES,
  COMPANY_DOCUMENT_META,
  COMPANY_LIMIT_SCOPES,
  type BackendKybDocumentType,
} from "./constants";
import { COMPANY_COPY } from "./copy";
import {
  formatCnpj,
  formatCompanyDateBr,
  formatCompanyDayMonthBr,
} from "./format";
import type {
  AveniaStatusKind,
  CompanyDocument,
  CompanyLimitRow,
  CompanyProfile,
  RawLimitCurrency,
  RawLimitModality,
  RawLimitsResponse,
  RawMeResponse,
  RawOnboardingCompany,
  RawOnboardingDocument,
  RawOnboardingStatus,
  RawUploadedDocumentResponse,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asUsedPctString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^\d+(?:\.\d+)?$/.test(trimmed) ? trimmed : null;
}

function asReferenceMonthString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed) ? trimmed : null;
}

const VALID_KYB_STATUSES = new Set([
  "PENDING",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "RESUBMIT",
]);

const ONBOARDING_COMPANY_KEYS = ["legalName", "cnpj", "cnae"] as const;

/**
 * Strictly validates `GET /v1/onboarding/company` response:
 * MUST be an object containing EXACTLY the 3 keys `{ legalName, cnpj, cnae }`,
 * each being a `string` or `null`. Any missing key, extra key, or other value
 * type returns `null` (error).
 */
export function parseOnboardingCompany(
  raw: unknown,
): RawOnboardingCompany | null {
  if (!isRecord(raw)) return null;

  const keys = Object.keys(raw);
  if (keys.length !== ONBOARDING_COMPANY_KEYS.length) return null;

  for (const key of ONBOARDING_COMPANY_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) return null;
    const val = raw[key];
    if (val !== null && typeof val !== "string") return null;
  }

  return {
    legalName: raw.legalName === null ? null : asNonEmptyString(raw.legalName),
    cnpj: raw.cnpj === null ? null : asNonEmptyString(raw.cnpj),
    cnae: raw.cnae === null ? null : asNonEmptyString(raw.cnae),
  };
}

export function parseOnboardingStatus(raw: unknown): RawOnboardingStatus | null {
  if (!isRecord(raw)) return null;
  const kybStatus = asNonEmptyString(raw.kybStatus);
  if (!kybStatus || !VALID_KYB_STATUSES.has(kybStatus)) return null;

  const docsRaw = Array.isArray(raw.documents) ? raw.documents : [];
  const documents: RawOnboardingDocument[] = [];
  for (const item of docsRaw) {
    if (!isRecord(item)) continue;
    const id = asNonEmptyString(item.id);
    const type = asNonEmptyString(item.type);
    const fileName = asNonEmptyString(item.fileName);
    if (!id || !type || !fileName) continue;
    documents.push({
      id,
      type,
      fileName,
      fileSizeKb: asFiniteNumber(item.fileSizeKb) ?? 0,
      uploadedAt: asNonEmptyString(item.uploadedAt) ?? "",
    });
  }

  const missingDocuments = Array.isArray(raw.missingDocuments)
    ? raw.missingDocuments.filter(
        (m): m is string => typeof m === "string" && m.trim().length > 0,
      )
    : [];

  return {
    kybStatus: kybStatus as RawOnboardingStatus["kybStatus"],
    kybSubmittedAt: asNonEmptyString(raw.kybSubmittedAt),
    kybApprovedAt: asNonEmptyString(raw.kybApprovedAt),
    kybRejectedReason: asNonEmptyString(raw.kybRejectedReason),
    documents,
    missingDocuments,
  };
}

export function parseUploadedDocumentResponse(
  raw: unknown,
): RawUploadedDocumentResponse | null {
  if (!isRecord(raw)) return null;
  const documentId = asNonEmptyString(raw.documentId) ?? asNonEmptyString(raw.id);
  const type = asNonEmptyString(raw.type);
  const fileName = asNonEmptyString(raw.fileName);
  if (!documentId || !type || !fileName) return null;
  return {
    documentId,
    type,
    fileName,
    fileSizeKb: asFiniteNumber(raw.fileSizeKb) ?? 0,
    uploadedAt: asNonEmptyString(raw.uploadedAt),
  };
}

function parseModality(raw: unknown): RawLimitModality {
  if (!isRecord(raw)) {
    return { max: null, used: null, available: null, usedPct: null };
  }
  return {
    max: asFiniteNumber(raw.max),
    used: asFiniteNumber(raw.used),
    available: asFiniteNumber(raw.available),
    usedPct: asUsedPctString(raw.usedPct),
  };
}

export function parseLimitsResponse(raw: unknown): RawLimitsResponse | null {
  if (!isRecord(raw)) return null;
  const aveniaReason = asNonEmptyString(raw.aveniaReason);

  if (raw.avenia === null || raw.avenia === undefined) {
    return { avenia: null, aveniaReason };
  }
  if (!isRecord(raw.avenia)) {
    return null;
  }

  const byCurrencyRaw = Array.isArray(raw.avenia.byCurrency)
    ? raw.avenia.byCurrency
    : [];
  const byCurrency: RawLimitCurrency[] = [];
  for (const row of byCurrencyRaw) {
    if (!isRecord(row)) continue;
    const currency = asNonEmptyString(row.currency);
    if (!currency) continue;
    byCurrency.push({
      currency: currency.toUpperCase(),
      period: row.period === "monthly" ? "monthly" : null,
      referenceMonth: asReferenceMonthString(row.referenceMonth),
      unlocked: typeof row.unlocked === "boolean" ? row.unlocked : null,
      fiatIn: parseModality(row.fiatIn),
      fiatOut: parseModality(row.fiatOut),
      chainIn: parseModality(row.chainIn),
      chainOut: parseModality(row.chainOut),
    });
  }

  return {
    avenia: {
      blocked: raw.avenia.blocked === true,
      byCurrency,
    },
    aveniaReason,
  };
}

export function parseMeResponse(raw: unknown): RawMeResponse | null {
  if (!isRecord(raw)) return null;
  const id = asNonEmptyString(raw.id);
  const email = asNonEmptyString(raw.email);
  if (!id || !email) return null;
  return {
    id,
    email,
    name: asNonEmptyString(raw.name),
    kycStatus: asNonEmptyString(raw.kycStatus) ?? "NOT_SUBMITTED",
  };
}

/**
 * Validates a file chosen for upload before sending to `POST /v1/onboarding/documents/:type`.
 * Returns a safe pt-BR error message, or `null` when valid.
 */
export function validateCompanyDocumentFile(
  file: Pick<File, "type" | "size" | "name">,
): string | null {
  if (file.size <= 0) {
    return COMPANY_COPY.documents.errors.emptyFile;
  }
  if (!COMPANY_DOC_ALLOWED_MIMES.has(file.type)) {
    return COMPANY_COPY.documents.errors.invalidType;
  }
  if (file.size > COMPANY_DOC_MAX_BYTES) {
    return COMPANY_COPY.documents.errors.fileTooLarge;
  }
  return null;
}

/**
 * Maps the global KYB status returned by `GET /v1/onboarding/status`.
 * NEVER assumes "approved" when onboarding data is absent — degrades safely to
 * `"Status indisponível no momento"` with neutral styling.
 */
export function resolveAveniaStatus(
  onboarding: RawOnboardingStatus | null,
): { kind: AveniaStatusKind; label: string } {
  if (!onboarding) {
    return {
      kind: "unavailable",
      label: COMPANY_COPY.aveniaStatus.unavailable,
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
      return {
        kind: "pending",
        label: COMPANY_COPY.aveniaStatus.pending,
      };
  }
}

/**
 * Maps real profile fields from `GET /v1/onboarding/company` and email from `/auth/me`.
 * Returns `null` when `/v1/onboarding/company` failed or failed strict 3-key validation.
 * Never invents missing fields or uses user personal `name` as company name.
 */
export function mapCompanyProfile(input: {
  company: RawOnboardingCompany | null;
  me: RawMeResponse | null;
  onboarding: RawOnboardingStatus | null;
}): CompanyProfile | null {
  if (!input.company) {
    return null;
  }

  const status = resolveAveniaStatus(input.onboarding);

  return {
    legalName: input.company.legalName,
    cnpj: input.company.cnpj ? formatCnpj(input.company.cnpj) : null,
    cnae: input.company.cnae,
    email: input.me?.email ?? null,
    aveniaStatusKind: status.kind,
    aveniaStatusLabel: status.label,
  };
}

function humanizeUnknownDocType(type: string): string {
  const cleaned = type.replace(/[_-]+/g, " ").trim().toLowerCase();
  if (!cleaned) return "Documento";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function formatUploadedDocumentStatus(
  uploadedAt: string | Date | null,
): {
  uploadedAtLabel: string | null;
  uploadedDayMonthLabel: string | null;
  statusLabel: string;
} {
  if (!uploadedAt) {
    return {
      uploadedAtLabel: null,
      uploadedDayMonthLabel: null,
      statusLabel: COMPANY_COPY.documents.status.uploadedFallback,
    };
  }

  const fullDate = formatCompanyDateBr(uploadedAt);
  const dayMonth = formatCompanyDayMonthBr(uploadedAt);

  return {
    uploadedAtLabel: fullDate || null,
    uploadedDayMonthLabel: dayMonth || null,
    statusLabel: dayMonth
      ? `${COMPANY_COPY.documents.status.uploadedPrefix} ${dayMonth}`
      : COMPANY_COPY.documents.status.uploadedFallback,
  };
}

/**
 * Maps strictly the documents actually returned by `GET /v1/onboarding/status`
 * (`documents` + `missingDocuments`). Never fabricates rows or per-document approval.
 */
export function mapCompanyDocuments(
  onboarding: RawOnboardingStatus | null,
): CompanyDocument[] {
  if (!onboarding) {
    return [];
  }

  const uploadedByType = new Map<string, RawOnboardingDocument>();
  for (const doc of onboarding.documents) {
    uploadedByType.set(doc.type.toUpperCase(), doc);
  }

  const missingSet = new Set<string>(
    onboarding.missingDocuments.map((type) => type.toUpperCase()),
  );

  // Only include types actually present in `documents` or `missingDocuments`,
  // sorted canonically when known.
  const presentTypes = new Set<string>([
    ...uploadedByType.keys(),
    ...missingSet.keys(),
  ]);

  const orderedTypes: string[] = [];
  for (const canonical of BACKEND_KYB_DOCUMENT_TYPES) {
    if (presentTypes.has(canonical)) {
      orderedTypes.push(canonical);
    }
  }
  for (const extra of presentTypes) {
    if (!orderedTypes.includes(extra)) {
      orderedTypes.push(extra);
    }
  }

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
      const formatted = formatUploadedDocumentStatus(uploaded.uploadedAt || null);
      return {
        id: uploaded.id,
        apiType: isKnown ? (typeKey as BackendKybDocumentType) : null,
        name: meta.name,
        category: meta.category,
        fileName: uploaded.fileName,
        uploadedAtLabel: formatted.uploadedAtLabel,
        uploadedDayMonthLabel: formatted.uploadedDayMonthLabel,
        kind: "uploaded",
        statusLabel: formatted.statusLabel,
      };
    }

    return {
      id: typeKey,
      apiType: isKnown ? (typeKey as BackendKybDocumentType) : null,
      name: meta.name,
      category: meta.category,
      fileName: null,
      uploadedAtLabel: null,
      uploadedDayMonthLabel: null,
      kind: "pending",
      statusLabel: COMPANY_COPY.documents.status.pending,
    };
  });
}

function normalizeLimitScope(currency: string): {
  scope: string;
  label: string;
  isGlobal: boolean;
  unit: string;
} {
  if (currency === "*" || currency === "GLOBAL") {
    return {
      scope: "GLOBAL",
      label: COMPANY_COPY.limits.globalLabel,
      isGlobal: true,
      unit: "USD",
    };
  }
  return {
    scope: currency,
    label: currency,
    isGlobal: false,
    unit: currency,
  };
}

function selectModality(
  fiat: RawLimitModality,
  chain: RawLimitModality,
): RawLimitModality {
  if (fiat.max !== null || fiat.used !== null || fiat.usedPct !== null) {
    return fiat;
  }
  return chain;
}

/**
 * Maps ONLY currencies actually returned by `GET /v1/limits`.
 * Preserves rows with `unlocked === false` even when limit figures are null so
 * they display `"Moeda ainda não habilitada"`. Never fabricates rows for absent currencies.
 */
export function mapCompanyLimits(
  limitsResponse: RawLimitsResponse | null,
): CompanyLimitRow[] {
  const byCurrency = limitsResponse?.avenia?.byCurrency;
  if (!byCurrency || byCurrency.length === 0) {
    return [];
  }

  const rows: CompanyLimitRow[] = [];
  for (const raw of byCurrency) {
    const entrySource = selectModality(raw.fiatIn, raw.chainIn);
    const exitSource = selectModality(raw.fiatOut, raw.chainOut);

    if (
      raw.unlocked !== false &&
      entrySource.max === null &&
      exitSource.max === null
    ) {
      continue;
    }

    const meta = normalizeLimitScope(raw.currency);
    rows.push({
      id: meta.scope,
      scope: meta.scope,
      label: meta.label,
      isGlobal: meta.isGlobal,
      period: raw.period,
      referenceMonth: raw.referenceMonth,
      unlocked: raw.unlocked,
      entry: {
        used: entrySource.used,
        max: entrySource.max,
        usedPct: entrySource.usedPct,
        unit: meta.unit,
      },
      exit: {
        used: exitSource.used,
        max: exitSource.max,
        usedPct: exitSource.usedPct,
        unit: meta.unit,
      },
    });
  }

  const scopeOrder = new Map<string, number>(
    COMPANY_LIMIT_SCOPES.map((s, idx) => [s, idx]),
  );

  return rows.sort((a, b) => {
    const rankA = scopeOrder.get(a.scope) ?? 99;
    const rankB = scopeOrder.get(b.scope) ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return a.scope.localeCompare(b.scope);
  });
}
