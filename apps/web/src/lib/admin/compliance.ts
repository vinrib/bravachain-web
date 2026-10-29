/**
 * Client-side calls for the compliance-review admin area, via the authenticated
 * BFF proxy (`apiFetch`). Responses are normalized defensively into the types in
 * `./types`. Mutations return the full, freshly-read detail the backend sends
 * back (PUT /review, POST /decision return the updated view); the grandfathered
 * PATCH is followed by a re-read so callers never rely on optimistic state.
 */
import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import type {
  ClientDetail,
  ClientListItem,
  ClientListResponse,
  Decision,
  GateDecision,
  KybDocument,
  Owner,
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
  grandfathered?: boolean;
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
  const approvals = asRecord(r.approvals);
  const requiredRaw = approvals.required;
  return {
    userId: str(r.userId) ?? "",
    companyName: str(r.companyName),
    companyCnpj: str(r.companyCnpj),
    kybStatus: str(r.kybStatus),
    reviewStatus: (str(r.reviewStatus) as ReviewStatus) ?? "NOT_STARTED",
    riskLevel: (str(r.riskLevel) as RiskLevel) ?? null,
    isPep: bool(r.isPep),
    complianceGrandfathered: bool(r.complianceGrandfathered),
    approvals: {
      approved: intOr(approvals.approved, 0),
      required: typeof requiredRaw === "number" ? requiredRaw : null,
    },
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
  if (params.grandfathered) qs.set("grandfathered", "true");
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

function normalizeOwner(raw: unknown): Owner {
  const r = asRecord(raw);
  return {
    id: str(r.id) ?? "",
    fullName: str(r.fullName) ?? "",
    cpf: typeof r.cpf === "string" ? r.cpf : "",
    ownershipPercent:
      typeof r.ownershipPercent === "number" ||
      typeof r.ownershipPercent === "string"
        ? (r.ownershipPercent as number | string)
        : null,
    role: str(r.role),
    isPep: bool(r.isPep),
    pepRole: str(r.pepRole),
    pepEndedAt: str(r.pepEndedAt),
    relatedToPep: bool(r.relatedToPep),
    notes: str(r.notes),
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

function normalizeGate(raw: unknown): GateDecision | null {
  if (!raw || typeof raw !== "object") return null;
  const r = asRecord(raw);
  if (r.allowed === true) return { allowed: true };
  if (r.allowed === false) {
    return {
      allowed: false,
      reason: str(r.reason) ?? "UNKNOWN",
      accountType: str(r.accountType) ?? undefined,
      identityStatus: str(r.identityStatus) ?? undefined,
      kybStatus: str(r.kybStatus) ?? undefined,
      complianceReviewStatus: str(r.complianceReviewStatus) ?? undefined,
    };
  }
  return null;
}

export function normalizeDetail(raw: unknown): ClientDetail {
  const r = asRecord(raw);
  return {
    userId: str(r.userId) ?? "",
    accountType: str(r.accountType),
    kybStatus: str(r.kybStatus),
    complianceGrandfathered: bool(r.complianceGrandfathered),
    simulatedGateDecision: normalizeGate(r.simulatedGateDecision),
    review: normalizeReview(r.review),
    approvals: Array.isArray(r.approvals)
      ? r.approvals.map((a) => {
          const ar = asRecord(a);
          return {
            approverUserId: str(ar.approverUserId) ?? "",
            decision: (str(ar.decision) as Decision) ?? "APPROVE",
            note: str(ar.note),
            createdAt: str(ar.createdAt),
          };
        })
      : [],
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

export async function decide(
  userId: string,
  decision: Decision,
  note: string | undefined,
): Promise<ClientDetail> {
  return normalizeDetail(
    await apiFetch<unknown>(endpoints.admin.complianceDecision(userId), {
      method: "POST",
      body: JSON.stringify({ decision, note }),
    }),
  );
}

export async function setGrandfathered(
  userId: string,
  grandfathered: boolean,
  reason: string,
): Promise<ClientDetail> {
  await apiFetch<unknown>(endpoints.admin.complianceGrandfathered(userId), {
    method: "PATCH",
    body: JSON.stringify({ grandfathered, reason }),
  });
  // The PATCH returns a partial payload; re-read the full detail (never trust
  // optimistic state for exceptions).
  return getClient(userId);
}
