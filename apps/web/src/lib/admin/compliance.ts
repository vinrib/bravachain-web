/**
 * Client-side calls for the compliance-review admin area, via the authenticated
 * BFF proxy (`apiFetch`). Responses are normalized defensively into the types in
 * `./types`. Bravachain does not approve, reject, or limit clients or operations
 * (#92) — `saveReview` only stores an internal annotation (risk, PEP/source-of-
 * funds notes); it never changes the client's status or eligibility. Mutations
 * return the full, freshly-read detail the backend sends back.
 */
import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import type {
  ClientDetail,
  ClientListItem,
  ClientListResponse,
  Company,
  KybDocument,
  Owner,
  OwnerPayload,
  Review,
  ReviewStatus,
  RiskLevel,
  UpsertReviewPayload,
} from "./types";

export interface ListClientsParams {
  q?: string;
  reviewStatus?: ReviewStatus;
  risk?: RiskLevel;
  pep?: boolean;
  page?: number;
  pageSize?: number;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
function bool(v: unknown): boolean {
  return v === true;
}
function intOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function normalizeListItem(raw: unknown): ClientListItem {
  const r = asRecord(raw);
  return {
    userId: str(r.userId) ?? "",
    companyName: str(r.companyName),
    companyCnpj: str(r.companyCnpj),
    kybStatus: str(r.kybStatus),
    reviewStatus: (str(r.reviewStatus) as ReviewStatus) ?? "NOT_STARTED",
    riskLevel: (str(r.riskLevel) as RiskLevel) ?? null,
    isPep: bool(r.isPep),
    updatedAt: str(r.updatedAt),
  };
}

export async function listClients(
  params: ListClientsParams,
): Promise<ClientListResponse> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.reviewStatus) qs.set("reviewStatus", params.reviewStatus);
  if (params.risk) qs.set("risk", params.risk);
  if (params.pep) qs.set("pep", "true");
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));

  const body = await apiFetch<unknown>(
    `${endpoints.admin.complianceClients}?${qs.toString()}`,
  );
  const r = asRecord(body);
  const items = Array.isArray(r.items) ? r.items.map(normalizeListItem) : [];
  return {
    items,
    page: intOr(r.page, 1),
    pageSize: intOr(r.pageSize, items.length),
    total: intOr(r.total, items.length),
  };
}

function normalizeReview(raw: unknown): Review | null {
  if (!raw || typeof raw !== "object") return null;
  const r = asRecord(raw);
  return {
    status: (str(r.status) as ReviewStatus) ?? "NOT_STARTED",
    riskLevel: (str(r.riskLevel) as RiskLevel) ?? null,
    riskRationale: str(r.riskRationale),
    isPep: bool(r.isPep),
    pepNotes: str(r.pepNotes),
    sourceOfFundsNotes: str(r.sourceOfFundsNotes),
    projectedMonthlyVolumeBrl:
      typeof r.projectedMonthlyVolumeBrl === "number" ||
      typeof r.projectedMonthlyVolumeBrl === "string"
        ? (r.projectedMonthlyVolumeBrl as number | string)
        : null,
    publicFundsInvolved:
      typeof r.publicFundsInvolved === "boolean" ? r.publicFundsInvolved : null,
    reviewedAt: str(r.reviewedAt),
    nextReviewAt: str(r.nextReviewAt),
  };
}

function numOrStr(v: unknown): number | string | null {
  return typeof v === "number" || typeof v === "string"
    ? (v as number | string)
    : null;
}

function normalizeOwner(raw: unknown): Owner {
  const r = asRecord(raw);
  return {
    id: str(r.id) ?? "",
    fullName: str(r.fullName) ?? "",
    // The full CPF is never in the detail payload — only the server-masked form.
    cpfMasked: str(r.cpfMasked) ?? "•••.•••.•••-••",
    cpfRevealable: r.cpfRevealable !== false,
    ownershipPercent: numOrStr(r.ownershipPercent),
    role: str(r.role),
    isPep: bool(r.isPep),
    pepRole: str(r.pepRole),
    pepEndedAt: str(r.pepEndedAt),
    relatedToPep: bool(r.relatedToPep),
    notes: str(r.notes),
  };
}

function normalizeCompany(raw: unknown): Company | null {
  if (!raw || typeof raw !== "object") return null;
  const r = asRecord(raw);
  return {
    name: str(r.name),
    cnpj: str(r.cnpj),
    openingDate: str(r.openingDate),
    cnae: str(r.cnae),
    estimatedRevenue: numOrStr(r.estimatedRevenue),
    mainBuyerCountry: str(r.mainBuyerCountry),
    kybStatus: str(r.kybStatus),
    kybSubmittedAt: str(r.kybSubmittedAt),
  };
}

function normalizeDocument(raw: unknown): KybDocument {
  const r = asRecord(raw);
  return {
    id: str(r.id) ?? "",
    type: str(r.type) ?? "",
    fileName: str(r.fileName),
    fileSizeKb: typeof r.fileSizeKb === "number" ? r.fileSizeKb : null,
    uploadedAt: str(r.uploadedAt),
  };
}

export function normalizeDetail(raw: unknown): ClientDetail {
  const r = asRecord(raw);
  return {
    userId: str(r.userId) ?? "",
    accountType: str(r.accountType),
    kybStatus: str(r.kybStatus),
    company: normalizeCompany(r.company),
    review: normalizeReview(r.review),
    owners: Array.isArray(r.owners) ? r.owners.map(normalizeOwner) : [],
    documents: Array.isArray(r.documents) ? r.documents.map(normalizeDocument) : [],
  };
}

export async function getClient(userId: string): Promise<ClientDetail> {
  return normalizeDetail(await apiFetch<unknown>(endpoints.admin.complianceClient(userId)));
}

export async function saveReview(
  userId: string,
  payload: UpsertReviewPayload,
): Promise<ClientDetail> {
  return normalizeDetail(
    await apiFetch<unknown>(endpoints.admin.complianceReview(userId), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  );
}

/**
 * Reveal one owner's full CPF via the audited route. Returns the raw digits —
 * the caller keeps them in memory only, never persisting or logging them. The
 * 20/min limit surfaces as an {@link ApiError} with status 429.
 */
export async function revealOwnerCpf(
  userId: string,
  ownerId: string,
): Promise<string> {
  const body = await apiFetch<unknown>(
    endpoints.admin.complianceOwnerRevealCpf(userId, ownerId),
    { method: "POST" },
  );
  const cpf = asRecord(body).cpf;
  return typeof cpf === "string" ? cpf : "";
}

/**
 * Request a short-lived signed URL for one KYB document. Returns the URL — the
 * caller opens it and never stores or logs it.
 */
export async function accessDocument(
  userId: string,
  documentId: string,
): Promise<string> {
  const body = await apiFetch<unknown>(
    endpoints.admin.complianceDocumentAccess(userId, documentId),
    { method: "POST" },
  );
  const url = asRecord(body).url;
  return typeof url === "string" ? url : "";
}

/** Serialize an owner payload, sending only the keys the reviewer actually set. */
function ownerBody(payload: OwnerPayload): string {
  const body: Record<string, unknown> = {
    fullName: payload.fullName,
    isPep: payload.isPep,
    relatedToPep: payload.relatedToPep,
  };
  if (payload.cpf) body.cpf = payload.cpf;
  if (payload.ownershipPercent !== undefined)
    body.ownershipPercent = payload.ownershipPercent;
  if (payload.role !== undefined) body.role = payload.role;
  if (payload.pepRole !== undefined) body.pepRole = payload.pepRole;
  if (payload.pepEndedAt !== undefined) body.pepEndedAt = payload.pepEndedAt;
  if (payload.notes !== undefined) body.notes = payload.notes;
  if (payload.reason) body.reason = payload.reason;
  return JSON.stringify(body);
}

/** Add a beneficial owner. Returns the freshly-read detail (no optimistic state). */
export async function addOwner(
  userId: string,
  payload: OwnerPayload,
): Promise<ClientDetail> {
  return normalizeDetail(
    await apiFetch<unknown>(endpoints.admin.complianceOwnerCreate(userId), {
      method: "POST",
      body: ownerBody(payload),
    }),
  );
}

/** Edit a beneficial owner. Returns the freshly-read detail (no optimistic state). */
export async function updateOwner(
  userId: string,
  ownerId: string,
  payload: OwnerPayload,
): Promise<ClientDetail> {
  return normalizeDetail(
    await apiFetch<unknown>(endpoints.admin.complianceOwner(userId, ownerId), {
      method: "PATCH",
      body: ownerBody(payload),
    }),
  );
}

/** Remove a beneficial owner (reason mandatory). Returns the freshly-read detail. */
export async function removeOwner(
  userId: string,
  ownerId: string,
  reason: string,
): Promise<ClientDetail> {
  return normalizeDetail(
    await apiFetch<unknown>(endpoints.admin.complianceOwner(userId, ownerId), {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }),
  );
}
