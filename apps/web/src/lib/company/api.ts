import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import { BACKEND_KYB_DOCUMENT_TYPE_SET } from "./constants";
import type { CompanyBundle, CompanyDocument } from "./types";
import {
  formatUploadedDocumentStatus,
  mapCompanyDocuments,
  mapCompanyLimits,
  mapCompanyProfile,
  parseBrandingResponse,
  parseLimitsResponse,
  parseMeResponse,
  parseOnboardingStatus,
  parseUploadedDocumentResponse,
  resolveAveniaStatus,
} from "./validate";

type FetchOutcome<T> = { ok: true; data: T } | { ok: false };

async function fetchParsed<T>(
  path: string,
  parser: (raw: unknown) => T | null,
  signal?: AbortSignal,
): Promise<FetchOutcome<T>> {
  try {
    const raw = await apiFetch<unknown>(path, { signal });
    const parsed = parser(raw);
    if (parsed === null) {
      return { ok: false };
    }
    return { ok: true, data: parsed };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    return { ok: false };
  }
}

/**
 * Fetches real backend endpoints in parallel without any hardcoded fallback data.
 * Each section tracks its own real fetch outcome so partial failures degrade
 * honestly into explicit error states with retry.
 */
export async function fetchCompanyBundle(
  signal?: AbortSignal,
): Promise<CompanyBundle> {
  const [onboardingRes, limitsRes, meRes, brandingRes] = await Promise.all([
    fetchParsed(endpoints.onboarding.status, parseOnboardingStatus, signal),
    fetchParsed(endpoints.limits.root, parseLimitsResponse, signal),
    fetchParsed(endpoints.auth.me, parseMeResponse, signal),
    fetchParsed(endpoints.profile.branding, parseBrandingResponse, signal),
  ]);

  const onboarding = onboardingRes.ok ? onboardingRes.data : null;
  const limitsPayload = limitsRes.ok ? limitsRes.data : null;
  const me = meRes.ok ? meRes.data : null;
  const branding = brandingRes.ok ? brandingRes.data : null;

  const status = resolveAveniaStatus(onboarding);
  const profile = mapCompanyProfile({ me, branding, onboarding });

  return {
    profile,
    profileError: profile === null,
    aveniaStatusKind: status.kind,
    aveniaStatusLabel: status.label,
    // No client-facing UBO/PEP endpoint exists yet; never fabricate partners.
    pepPartners: [],
    documents: mapCompanyDocuments(onboarding),
    onboardingError: !onboardingRes.ok,
    limits: mapCompanyLimits(limitsPayload),
    limitsError: !limitsRes.ok,
    limitsUnavailableReason:
      limitsPayload && limitsPayload.avenia === null
        ? limitsPayload.aveniaReason
        : null,
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
