"use client";

import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import { normalizeDashboard } from "./normalize";
import type { DashboardData, DashboardPeriod } from "./types";

/** Single combined call — returns summary, tpv, rates, rails for the period. */
export function getDashboard(period: DashboardPeriod): Promise<DashboardData> {
  return apiFetch<unknown>(
    `${endpoints.dashboard.financial}?period=${period}`,
  ).then(normalizeDashboard);
}
