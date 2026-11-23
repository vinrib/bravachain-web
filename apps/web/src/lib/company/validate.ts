import {
  COMPANY_DOC_ALLOWED_MIMES,
  COMPANY_DOC_MAX_BYTES,
} from "./constants";
import { COMPANY_COPY } from "./copy";
import type {
  RawBrandingResponse,
  RawLimitCurrency,
  RawLimitModality,
  RawLimitsResponse,
  RawMeResponse,
  RawOnboardingDocument,
  RawOnboardingStatus,
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

const VALID_KYB_STATUSES = new Set([
  "PENDING",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "RESUBMIT",
]);

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

function parseModality(raw: unknown): RawLimitModality {
  if (!isRecord(raw)) {
    return { max: null, used: null, available: null };
  }
  return {
    max: asFiniteNumber(raw.max),
    used: asFiniteNumber(raw.used),
    available: asFiniteNumber(raw.available),
  };
}

export function parseLimitsResponse(raw: unknown): RawLimitsResponse | null {
  if (!isRecord(raw)) return null;
  const aveniaReason = asNonEmptyString(raw.aveniaReason);

  if (!isRecord(raw.avenia)) {
    return { avenia: null, aveniaReason };
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

export function parseBrandingResponse(
  raw: unknown,
): RawBrandingResponse | null {
  if (!isRecord(raw)) return null;
  return {
    companyDisplayName: asNonEmptyString(raw.companyDisplayName),
    companyLogoUrl: asNonEmptyString(raw.companyLogoUrl),
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
