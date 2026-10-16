"use client";

import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";

/**
 * GET /v1/onboarding/status (OnboardingController) — KYB status + documents.
 * The response is not typed in the committed openapi, so this normalizes
 * defensively. Nothing is invented: unknown document states map to "pending".
 */
export type KybStatus = "approved" | "pending" | "in_review" | "rejected" | "unknown";
export type DocState = "sent" | "pending" | "rejected" | "approved";

export interface OnboardingDoc {
  type: string;
  label: string;
  state: DocState;
}

export interface OnboardingStatus {
  status: KybStatus;
  documents: OnboardingDoc[];
  rejectionReason: string | null;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strN = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function pick(o: Obj, ...keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

function mapStatus(raw: string): KybStatus {
  const s = raw.toUpperCase();
  if (/APPROV|VERIFIED|COMPLET|DONE/.test(s)) return "approved";
  if (/REJECT|DENIED|FAIL/.test(s)) return "rejected";
  if (/REVIEW|ANALYS|PROCESS/.test(s)) return "in_review";
  if (/PEND|WAIT|REQUIRED|MISSING|NOT_STARTED|STARTED/.test(s)) return "pending";
  return "unknown";
}

function mapDocState(raw: string): DocState {
  const s = raw.toUpperCase();
  if (/APPROV|VERIFIED|ACCEPT|OK/.test(s)) return "approved";
  if (/REJECT|DENIED|INVALID/.test(s)) return "rejected";
  if (/SENT|SUBMIT|UPLOAD|RECEIV|PROVIDED/.test(s)) return "sent";
  return "pending";
}

const DOC_LABELS: Record<string, string> = {
  company: "Dados da empresa",
  companyData: "Dados da empresa",
  representative: "Representante legal",
  authorizedRepresentative: "Representante legal",
  identity: "Documento de identidade",
  address: "Comprovante de endereço",
};

export function normalizeOnboarding(raw: unknown): OnboardingStatus {
  const r = obj(raw);
  const status = mapStatus(str(pick(r, "status", "kybStatus", "localKycStatus")));
  const docsRaw = arr(pick(r, "documents", "docs"));
  const documents: OnboardingDoc[] = docsRaw.map((item) => {
    const d = obj(item);
    const type = str(pick(d, "type", "name", "kind"));
    const label = str(pick(d, "label", "title")) || DOC_LABELS[type] || type || "Documento";
    const state = mapDocState(str(pick(d, "state", "status")));
    return { type, label, state };
  });
  return {
    status,
    documents,
    rejectionReason: strN(pick(r, "rejectionReason", "reason", "rejectReason")),
  };
}

export function getOnboardingStatus(): Promise<OnboardingStatus> {
  return apiFetch<unknown>(endpoints.onboarding.status).then(normalizeOnboarding);
}
