"use client";

import { endpoints } from "@bravachain/api-client";
import { apiFetch } from "@/lib/client-api";
import {
  normalizeLive,
  normalizeHistory,
  normalizeConvert,
  normalizeAlerts,
} from "./normalize";
import type {
  AlertCondition,
  AlertStatus,
  ConvertResult,
  HistoryPeriod,
  LiveRates,
  RateAlert,
  RateHistory,
  RatePair,
} from "./types";

export function getLiveRates(): Promise<LiveRates> {
  return apiFetch<unknown>(endpoints.rates.live).then(normalizeLive);
}

export function getRateHistory(
  pair: RatePair,
  period: HistoryPeriod,
): Promise<RateHistory> {
  return apiFetch<unknown>(
    `${endpoints.rates.history}?pair=${pair}&period=${period}`,
  ).then(normalizeHistory);
}

export function convertRate(pair: RatePair, amount: number): Promise<ConvertResult> {
  return apiFetch<unknown>(
    `${endpoints.rates.convert}?pair=${pair}&amount=${amount}`,
  ).then(normalizeConvert);
}

export function listAlerts(): Promise<RateAlert[]> {
  return apiFetch<unknown>(endpoints.rates.alerts).then(normalizeAlerts);
}

export function createAlert(body: {
  pair: RatePair;
  condition: AlertCondition;
  targetRate: number;
  channels: string[];
}): Promise<unknown> {
  return apiFetch(endpoints.rates.alerts, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAlert(
  id: string,
  body: { status?: AlertStatus; targetRate?: number },
): Promise<unknown> {
  return apiFetch(endpoints.rates.alert(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteAlert(id: string): Promise<unknown> {
  return apiFetch(endpoints.rates.alert(id), { method: "DELETE" });
}
