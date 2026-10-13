"use client";

import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import {
  normalizeSummary,
  normalizeTpv,
  normalizeRails,
  normalizeRates,
} from "./normalize";
import type {
  DashboardPeriod,
  DashboardSummary,
  RailSlice,
  RatePoint,
  TpvPoint,
} from "./types";

function withPeriod(path: string, period: DashboardPeriod): string {
  return `${path}?period=${period}`;
}

export function getSummary(period: DashboardPeriod): Promise<DashboardSummary> {
  return apiFetch<unknown>(withPeriod(endpoints.dashboard.summary, period)).then(
    normalizeSummary,
  );
}

export function getTpv(period: DashboardPeriod): Promise<TpvPoint[]> {
  return apiFetch<unknown>(withPeriod(endpoints.dashboard.tpv, period)).then(
    normalizeTpv,
  );
}

export function getRails(period: DashboardPeriod): Promise<RailSlice[]> {
  return apiFetch<unknown>(withPeriod(endpoints.dashboard.rails, period)).then(
    normalizeRails,
  );
}

export function getRates(period: DashboardPeriod): Promise<RatePoint[]> {
  return apiFetch<unknown>(withPeriod(endpoints.dashboard.rates, period)).then(
    normalizeRates,
  );
}
