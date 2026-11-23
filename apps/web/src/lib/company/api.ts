import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import { COMPANY_COPY } from "./copy";
import {
  buildCompanyDocuments,
  buildCompanyLimits,
  buildCompanyProfile,
  getInitialPepPartners,
} from "./fallback-adapter";
import { formatCompanyDateBr } from "./format";
import type { CompanyBundle, CompanyDocument } from "./types";
import {
  parseBrandingResponse,
  parseLimitsResponse,
  parseMeResponse,
  parseOnboardingStatus,
} from "./validate";

async function safeGet<T>(
  path: string,
  parser: (raw: unknown) => T | null,
  signal?: AbortSignal,
): Promise<T | null> {
  try {
    const raw = await apiFetch<unknown>(path, { signal });
    return parser(raw);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    return null;
  }
}

/**
 * Fetches real backend endpoints in parallel and merges missing sections/fields
 * through the typed hybrid fallback adapter (`fallback-adapter.ts`).
 */
export async function fetchCompanyBundle(
  signal?: AbortSignal,
): Promise<CompanyBundle> {
  const [onboarding, limits, me, branding] = await Promise.all([
    safeGet(endpoints.onboarding.status, parseOnboardingStatus, signal),
    safeGet(endpoints.limits.root, parseLimitsResponse, signal),
    safeGet(endpoints.auth.me, parseMeResponse, signal),
    safeGet(endpoints.profile.branding, parseBrandingResponse, signal),
  ]);

  return {
    profile: buildCompanyProfile({ me, branding, onboarding }),
    pepPartners: getInitialPepPartners(),
    documents: buildCompanyDocuments(onboarding),
    limits: buildCompanyLimits(limits),
  };
}

/**
 * Uploads a document to `POST /v1/onboarding/documents/:type` when supported by
 * the backend. Always transitions the returned document to
 * `"Enviado — em análise pela Avenia"` — NEVER marks it as approved locally.
 */
export async function uploadCompanyDocument(
  doc: CompanyDocument,
  file: File,
): Promise<CompanyDocument> {
  const todayLabel = formatCompanyDateBr(new Date());

  if (doc.apiType) {
    const form = new FormData();
    form.append("file", file);

    const res = await apiFetch<{
      documentId?: string;
      fileName?: string;
    }>(endpoints.onboarding.uploadDocument(doc.apiType), {
      method: "POST",
      body: form,
    });

    return {
      ...doc,
      id: res?.documentId ?? doc.id,
      fileName: res?.fileName ?? file.name,
      uploadedAtLabel: todayLabel,
      status: COMPANY_COPY.documents.status.inAnalysis,
    };
  }

  // TODO: conectar endpoint real da Avenia para tipos de documento ainda não mapeados no enum KybDocumentType.
  return {
    ...doc,
    fileName: file.name,
    uploadedAtLabel: todayLabel,
    status: COMPANY_COPY.documents.status.inAnalysis,
  };
}

/**
 * Submits a partner's PEP declaration state.
 */
export async function submitPartnerPepDeclaration(
  partnerId: string,
  isPep: boolean,
): Promise<{ partnerId: string; isPep: boolean }> {
  // TODO: conectar endpoint real da Avenia para persistir e enviar a declaração de PEP dos sócios/beneficiários finais.
  return { partnerId, isPep };
}
