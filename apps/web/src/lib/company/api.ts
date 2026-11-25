import { endpoints } from "@bravachain/api-client";
import { ApiError, apiFetch } from "@/lib/client-api";
import { BACKEND_KYB_DOCUMENT_TYPE_SET } from "./constants";
import type {
  CompanyBundle,
  CompanyDocument,
  CompanyLimitRow,
  RawMeResponse,
  RawOnboardingCompany,
  RawOnboardingStatus,
} from "./types";
import {
  formatUploadedDocumentStatus,
  mapCompanyDocuments,
  mapCompanyLimits,
  mapCompanyProfile,
  parseLimitsResponse,
  parseMeResponse,
  parseOnboardingCompany,
  parseOnboardingStatus,
  parseUploadedDocumentResponse,
  resolveAveniaStatus,
} from "./validate";

type FetchOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; status: number | null };

async function fetchParsed<T>(
  path: string,
  parser: (raw: unknown) => T | null,
  signal?: AbortSignal,
): Promise<FetchOutcome<T>> {
  try {
    const raw = await apiFetch<unknown>(path, { signal });
    const parsed = parser(raw);
    if (parsed === null) {
      return { ok: false, status: null };
    }
    return { ok: true, data: parsed };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    const status = err instanceof ApiError ? err.status : null;
    return { ok: false, status };
  }
}

export interface ProfileSectionResult {
  company: RawOnboardingCompany | null;
  me: RawMeResponse | null;
  error: boolean;
}

export interface OnboardingSectionResult {
  onboarding: RawOnboardingStatus | null;
  error: boolean;
}

export interface LimitsSectionResult {
  limits: CompanyLimitRow[];
  error: boolean;
  forbidden: boolean;
  unavailableReason: string | null;
}

/**
 * Fetches Perfil data (`GET /v1/onboarding/company` + `GET /auth/me` for email).
 * Fails ONLY when `/v1/onboarding/company` errors or fails strict 3-key validation.
 */
export async function fetchCompanyProfileSection(
  signal?: AbortSignal,
): Promise<ProfileSectionResult> {
  const [companyRes, meRes] = await Promise.all([
    fetchParsed(endpoints.onboarding.company, parseOnboardingCompany, signal),
    fetchParsed(endpoints.auth.me, parseMeResponse, signal),
  ]);

  return {
    company: companyRes.ok ? companyRes.data : null,
    me: meRes.ok ? meRes.data : null,
    error: !companyRes.ok,
  };
}

/**
 * Fetches global Avenia onboarding status & document list (`GET /v1/onboarding/status`).
 */
export async function fetchCompanyOnboardingSection(
  signal?: AbortSignal,
): Promise<OnboardingSectionResult> {
  const onboardingRes = await fetchParsed(
    endpoints.onboarding.status,
    parseOnboardingStatus,
    signal,
  );

  return {
    onboarding: onboardingRes.ok ? onboardingRes.data : null,
    error: !onboardingRes.ok,
  };
}

/**
 * Fetches Avenia operational limits (`GET /v1/limits`).
 * Distinguishes HTTP 403 (onboarding not yet approved) from technical errors.
 */
export async function fetchCompanyLimitsSection(
  signal?: AbortSignal,
): Promise<LimitsSectionResult> {
  const limitsRes = await fetchParsed(
    endpoints.limits.root,
    parseLimitsResponse,
    signal,
  );

  if (!limitsRes.ok) {
    if (limitsRes.status === 403) {
      return {
        limits: [],
        error: false,
        forbidden: true,
        unavailableReason: null,
      };
    }
    return {
      limits: [],
      error: true,
      forbidden: false,
      unavailableReason: null,
    };
  }

  const limitsPayload = limitsRes.data;
  return {
    limits: mapCompanyLimits(limitsPayload),
    error: false,
    forbidden: false,
    unavailableReason:
      limitsPayload.avenia === null ? limitsPayload.aveniaReason : null,
  };
}

/**
 * Fetches all company sections in parallel without any hardcoded fallback data.
 */
export async function fetchCompanyBundle(
  signal?: AbortSignal,
): Promise<CompanyBundle> {
  const [profileSection, onboardingSection, limitsSection] = await Promise.all([
    fetchCompanyProfileSection(signal),
    fetchCompanyOnboardingSection(signal),
    fetchCompanyLimitsSection(signal),
  ]);

  const status = resolveAveniaStatus(onboardingSection.onboarding);
  const profile = mapCompanyProfile({
    company: profileSection.company,
    me: profileSection.me,
    onboarding: onboardingSection.onboarding,
  });

  return {
    profile,
    profileError: profileSection.error || profile === null,
    aveniaStatusKind: status.kind,
    aveniaStatusLabel: status.label,
    // No client-facing UBO/PEP endpoint exists yet; never fabricate partners.
    pepPartners: [],
    documents: mapCompanyDocuments(onboardingSection.onboarding),
    onboardingError: onboardingSection.error,
    limits: limitsSection.limits,
    limitsError: limitsSection.error,
    limitsForbidden: limitsSection.forbidden,
    limitsUnavailableReason: limitsSection.unavailableReason,
  };
}

/**
 * Uploads a document to `POST /v1/onboarding/documents/:type` for mapped backend
 * types only. Uses the validated backend response body directly and never
 * fakes uploads for unmapped types or forces `"em análise"` / `"aprovado"`.
 */
export async function uploadCompanyDocument(
  doc: CompanyDocument,
  file: File,
): Promise<CompanyDocument> {
  if (!doc.apiType || !BACKEND_KYB_DOCUMENT_TYPE_SET.has(doc.apiType)) {
    throw new Error(
      `Upload não suportado para o tipo de documento: ${doc.id}`,
    );
  }

  const form = new FormData();
  form.append("file", file);

  const raw = await apiFetch<unknown>(
    endpoints.onboarding.uploadDocument(doc.apiType),
    {
      method: "POST",
      body: form,
    },
  );

  const parsed = parseUploadedDocumentResponse(raw);
  if (!parsed) {
    throw new Error("Resposta inválida ao enviar documento.");
  }

  const formatted = formatUploadedDocumentStatus(
    parsed.uploadedAt ?? new Date(),
  );

  return {
    ...doc,
    id: parsed.documentId,
    fileName: parsed.fileName,
    uploadedAtLabel: formatted.uploadedAtLabel,
    uploadedDayMonthLabel: formatted.uploadedDayMonthLabel,
    kind: "uploaded",
    statusLabel: formatted.statusLabel,
  };
}

/**
 * Local-only stub until a real client-facing PEP endpoint exists on the backend.
 * Never claims the declaration was sent to Avenia.
 */
export async function submitPartnerPepDeclaration(
  partnerId: string,
  isPep: boolean,
): Promise<{ partnerId: string; isPep: boolean; persisted: false }> {
  // TODO: conectar endpoint real de declaração de PEP quando existir no backend.
  return { partnerId, isPep, persisted: false };
}
