"use client";

import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";

export interface Branding {
  companyDisplayName: string | null;
  /** Signed URL (24h). Only render when it starts with "https://". */
  companyLogoUrl: string | null;
}

/** Accepted logo types and max size, validated on the client before upload. */
export const LOGO_ACCEPT = "image/jpeg,image/png,image/webp,image/svg+xml";
export const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const NAME_MAX = 80;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

/** Returns an error message, or null when the file is acceptable. */
export function validateLogo(file: File): string | null {
  if (!ALLOWED.has(file.type)) {
    return "Formato inválido. Use JPEG, PNG, WebP ou SVG.";
  }
  if (file.size > LOGO_MAX_BYTES) {
    return "Arquivo muito grande. O limite é 2 MB.";
  }
  return null;
}

function normalize(raw: unknown): Branding {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const name = r.companyDisplayName;
  const logo = r.companyLogoUrl;
  return {
    companyDisplayName: typeof name === "string" && name ? name : null,
    companyLogoUrl: typeof logo === "string" && logo ? logo : null,
  };
}

export function getBranding(): Promise<Branding> {
  return apiFetch<unknown>(endpoints.profile.branding).then(normalize);
}

/** POST multipart. `logo` optional; `companyDisplayName` optional (<= 80). */
export function updateBranding(input: {
  companyDisplayName?: string;
  logo?: File;
}): Promise<Branding> {
  const form = new FormData();
  if (input.companyDisplayName !== undefined) {
    form.append("companyDisplayName", input.companyDisplayName);
  }
  if (input.logo) form.append("logo", input.logo);
  return apiFetch<unknown>(endpoints.profile.branding, {
    method: "POST",
    body: form,
  }).then(normalize);
}
