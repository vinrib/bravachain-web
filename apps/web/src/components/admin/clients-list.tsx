"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { listClients, type ListClientsParams } from "@/lib/admin/compliance";
import { useDebounced } from "@/lib/admin/use-debounced";
import { formatCnpj, formatDateTimeBR } from "@/lib/admin/format";
import type {
  ClientListResponse,
  ReviewStatus,
  RiskLevel,
} from "@/lib/admin/types";
import { ReviewStatusChip, RiskChip, KybChip, PepTag, ExceptionTag } from "./badges";

const REVIEW_OPTIONS: ReviewStatus[] = [
  "NOT_STARTED",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
];
const RISK_OPTIONS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH"];
const GRID =
  "grid grid-cols-[minmax(0,1fr)_120px_120px_90px_70px_110px_96px_150px] gap-3 items-center";

export function ClientsList() {
  const t = useTranslations("admin.clients");
  const tc = useTranslations("admin.common");
  const trs = useTranslations("admin.reviewStatus");
  const trisk = useTranslations("admin.risk");

  const [q, setQ] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | "">("");
  const [risk, setRisk] = useState<RiskLevel | "">("");
  const [pep, setPep] = useState(false);
  const [grandfathered, setGrandfathered] = useState(false);
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ClientListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const debouncedQ = useDebounced(q.trim(), 350);
  const effectiveQ = debouncedQ.length >= 2 ? debouncedQ : undefined;

  // Any filter change returns to page 1.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [effectiveQ, reviewStatus, risk, pep, grandfathered]);

  const params: ListClientsParams = useMemo(
    () => ({
      q: effectiveQ,
      reviewStatus: reviewStatus || undefined,
      risk: risk || undefined,
      pep: pep || undefined,
      grandfathered: grandfathered || undefined,
      page,
      pageSize: 20,
    }),
    [effectiveQ, reviewStatus, risk, pep, grandfathered, page],
  );

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const res = await listClients(params);
        if (active) setData(res);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [params]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const hasRows = !!data && data.items.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="font-serif text-[26px] font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
          <label htmlFor="client-search" className="text-xs font-semibold text-foreground">
            {t("searchLabel")}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="client-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-border bg-input pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {q.trim().length === 1 && (
            <span className="text-xs text-muted-foreground">{t("searchMin")}</span>
          )}
        </div>

        <div className="flex w-[180px] flex-col gap-1.5">
          <label htmlFor="client-status" className="text-xs font-semibold text-foreground">
            {t("statusLabel")}
          </label>
          <select
            id="client-status"
            value={reviewStatus}
            onChange={(e) => setReviewStatus(e.target.value as ReviewStatus | "")}
            className="h-11 rounded-xl border border-border bg-input px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">{t("statusAll")}</option>
            {REVIEW_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {trs(s)}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-col gap-1.5 border-0 p-0">
          <legend className="mb-1.5 p-0 text-xs font-semibold text-foreground">
            {t("riskLabel")}
          </legend>
          <div className="flex gap-2">
            {RISK_OPTIONS.map((r) => {
              const active = risk === r;
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRisk(active ? "" : r)}
                  className={cn(
                    "h-11 rounded-full border px-4 text-sm font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {trisk(r)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex h-11 items-center gap-4">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={pep}
              onChange={(e) => setPep(e.target.checked)}
              className="h-5 w-5 accent-[#0b6b4f]"
            />
            {t("onlyPep")}
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={grandfathered}
              onChange={(e) => setGrandfathered(e.target.checked)}
              className="h-5 w-5 accent-[#0b6b4f]"
            />
            {t("onlyException")}
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <Spinner size="sm" /> {tc("loading")}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-sm text-destructive">{tc("loadError")}</div>
        ) : !hasRows ? (
          <div className="p-12 text-center text-sm text-muted-foreground">{t("empty")}</div>
        ) : (
          <>
            {/* Desktop table */}
            <div
              role="table"
              aria-label={t("title")}
              className="hidden md:block"
            >
              <div
                role="row"
                className={cn(
                  GRID,
                  "border-b border-border px-5 py-3 text-xs font-semibold text-muted-foreground",
                )}
              >
                <span role="columnheader">{t("colCompany")}</span>
                <span role="columnheader">{t("colKyb")}</span>
                <span role="columnheader">{t("colReview")}</span>
                <span role="columnheader">{t("colRisk")}</span>
                <span role="columnheader">{t("colPep")}</span>
                <span role="columnheader">{t("colException")}</span>
                <span role="columnheader">{t("colApprovals")}</span>
                <span role="columnheader">{t("colUpdated")}</span>
              </div>
              {data!.items.map((row) => (
                <Link
                  key={row.userId}
                  role="row"
                  href={`/admin/clientes/${row.userId}`}
                  aria-label={t("openReview", { name: row.companyName ?? row.userId })}
                  className={cn(
                    GRID,
                    "border-b border-border px-5 py-3.5 text-sm text-foreground transition-colors last:border-0 hover:bg-muted/60 focus:bg-muted/60 focus:outline-none",
                  )}
                >
                  <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-semibold">
                      {row.companyName ?? "—"}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatCnpj(row.companyCnpj) || "—"}
                    </span>
                  </span>
                  <span role="cell"><KybChip status={row.kybStatus} /></span>
                  <span role="cell"><ReviewStatusChip status={row.reviewStatus} /></span>
                  <span role="cell"><RiskChip risk={row.riskLevel} /></span>
                  <span role="cell"><PepTag isPep={row.isPep} /></span>
                  <span role="cell"><ExceptionTag on={row.complianceGrandfathered} /></span>
                  <span role="cell" className="text-sm">
                    {row.approvals.required === null
                      ? "—"
                      : t("approvalsOf", {
                          approved: row.approvals.approved,
                          required: row.approvals.required,
                        })}
                  </span>
                  <span role="cell" className="text-xs text-muted-foreground">
                    {formatDateTimeBR(row.updatedAt) || "—"}
                  </span>
                </Link>
              ))}
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-border md:hidden">
              {data!.items.map((row) => (
                <li key={row.userId}>
                  <Link
                    href={`/admin/clientes/${row.userId}`}
                    aria-label={t("openReview", { name: row.companyName ?? row.userId })}
                    className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/60 focus:bg-muted/60 focus:outline-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {row.companyName ?? "—"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {formatCnpj(row.companyCnpj) || "—"}
                        </p>
                      </div>
                      <ReviewStatusChip status={row.reviewStatus} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <KybChip status={row.kybStatus} />
                      <RiskChip risk={row.riskLevel} />
                      {row.isPep && <PepTag isPep />}
                      {row.complianceGrandfathered && <ExceptionTag on />}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {row.approvals.required === null
                          ? "—"
                          : t("approvalsOf", {
                              approved: row.approvals.approved,
                              required: row.approvals.required,
                            })}
                      </span>
                      <span>{formatDateTimeBR(row.updatedAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Pagination */}
      {hasRows && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("totalCount", { total: data!.total })}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground disabled:opacity-40"
              aria-label={tc("previous")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>{t("pageOf", { page, totalPages })}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground disabled:opacity-40"
              aria-label={tc("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
