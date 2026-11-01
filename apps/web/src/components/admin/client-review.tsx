"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ShieldAlert,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/client-api";
import {
  getClient,
  saveReview,
  revealOwnerCpf,
  removeOwner,
  accessDocument,
} from "@/lib/admin/compliance";
import { formatCnpj, formatCpf, formatDateTimeBR, formatDateBR, formatBrl } from "@/lib/admin/format";
import type {
  ClientDetail,
  Company,
  Owner,
  RiskLevel,
  UpsertReviewPayload,
} from "@/lib/admin/types";
import { ReviewStatusChip, RiskChip, PepTag } from "./badges";
import { ReasonModal } from "./reason-modal";
import { OwnerModal } from "./owner-modal";

const RISK_OPTIONS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH"];
const CPF_REVEAL_MS = 30_000;
/** KYB document types (the backend enum, in display order). */
const DOC_TYPES = [
  "CONTRATO_SOCIAL",
  "CARTAO_CNPJ",
  "DOCUMENTO_SOCIO",
  "COMPROVANTE_ENDERECO",
  "FATURAMENTO",
  "DECLARACAO_PEP",
  "ORIGEM_RECURSOS",
  "DEMONSTRACOES_FINANCEIRAS",
] as const;
/** Known business errors whose backend message (pt-BR) is safe to show verbatim. */
const BUSINESS_CODES = new Set(["RISK_FLOOR_VIOLATION", "RISK_LEVEL_REQUIRED"]);

export function ClientReview({ userId }: { userId: string }) {
  const t = useTranslations("admin.review");
  const tc = useTranslations("admin.common");

  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const d = await getClient(userId);
        if (active) setDetail(d);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-sm text-muted-foreground">
        <Spinner size="sm" /> {tc("loading")}
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackLink />
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-destructive">
          {tc("loadError")}
        </div>
      </div>
    );
  }

  const review = detail.review;
  const company = detail.company;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-[26px] font-bold text-foreground">
            {company?.name ?? "—"}
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {t("cnpj")} {formatCnpj(company?.cnpj) || "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReviewStatusChip status={review?.status ?? "NOT_STARTED"} />
          <RiskChip risk={review?.riskLevel ?? null} />
          {review?.isPep && <PepTag isPep />}
        </div>
      </div>

      <CompanyData company={company} />
      <OwnersSection userId={detail.userId} owners={detail.owners} onChanged={setDetail} />
      <DiligenceForm
        key={`${review?.status}-${review?.riskLevel}`}
        detail={detail}
        onSaved={setDetail}
      />
      <DocumentsSection userId={detail.userId} documents={detail.documents} />
    </div>
  );
}

// ─── Shared building blocks ────────────────────────────────────────────────────

function BackLink() {
  const t = useTranslations("admin.review");
  return (
    <Link
      href="/admin/clientes"
      className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("back")}
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-serif text-lg font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      {children}
    </div>
  );
}

function Textarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      maxLength={4000}
      className="w-full resize-none rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  const tc = useTranslations("admin.common");
  const opt = (label: string, on: boolean) => (
    <button
      type="button"
      aria-pressed={value === on}
      onClick={() => onChange(on)}
      className={cn(
        "h-11 flex-1 rounded-xl border text-sm font-semibold transition-colors",
        value === on
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="flex w-full gap-2">
      {opt(tc("yes"), true)}
      {opt(tc("no"), false)}
    </div>
  );
}

// ─── Company data (read straight from the detail; survives reload / deep link) ──

function CompanyData({ company }: { company: Company | null }) {
  const t = useTranslations("admin.review");
  const dash = (v: string | null | undefined) => (v && v.length > 0 ? v : "—");
  const rows: Array<[string, string]> = [
    [t("company.legalName"), dash(company?.name)],
    [t("company.cnpj"), formatCnpj(company?.cnpj) || "—"],
    [t("company.cnae"), dash(company?.cnae)],
    [t("company.openedAt"), formatDateBR(company?.openingDate) || "—"],
    [t("company.mainBuyerCountry"), dash(company?.mainBuyerCountry)],
    [t("company.estimatedRevenue"), formatBrl(company?.estimatedRevenue) || "—"],
    [t("company.kybStatus"), dash(company?.kybStatus)],
  ];
  return (
    <Section title={t("company.title")}>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
            <dd className="text-sm text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

// ─── Owners (CPF masked server-side; reveal is audited, in memory only) ─────────

function OwnersSection({
  userId,
  owners,
  onChanged,
}: {
  userId: string;
  owners: Owner[];
  onChanged: (detail: ClientDetail) => void;
}) {
  const t = useTranslations("admin.review");
  // `undefined` closed, `null` = create, an Owner = edit that owner.
  const [modalOwner, setModalOwner] = useState<Owner | null | undefined>(undefined);
  const [removeTarget, setRemoveTarget] = useState<Owner | null>(null);

  return (
    <Section title={t("owners.title")}>
      {owners.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("owners.empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {owners.map((o) => (
            <OwnerRow
              key={o.id}
              userId={userId}
              owner={o}
              onEdit={() => setModalOwner(o)}
              onRemove={() => setRemoveTarget(o)}
            />
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Button type="button" size="sm" variant="secondary" onClick={() => setModalOwner(null)}>
          <Plus className="h-4 w-4" />
          {t("owners.add")}
        </Button>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        {t("owners.cpfNote")}
      </p>

      <OwnerModal
        open={modalOwner !== undefined}
        onOpenChange={(o) => !o && setModalOwner(undefined)}
        userId={userId}
        owner={modalOwner}
        onSaved={onChanged}
      />

      <ReasonModal
        open={removeTarget !== null}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title={t("owners.removeTitle", { name: removeTarget?.fullName ?? "" })}
        description={t("owners.removeBody")}
        reasonLabel={t("owners.removeReasonLabel")}
        confirmLabel={t("owners.remove")}
        destructive
        onConfirm={async (reason) => {
          if (!removeTarget) return;
          onChanged(await removeOwner(userId, removeTarget.id, reason));
          setRemoveTarget(null);
        }}
      />
    </Section>
  );
}

function OwnerRow({
  userId,
  owner,
  onEdit,
  onRemove,
}: {
  userId: string;
  owner: Owner;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("admin.review");
  const tc = useTranslations("admin.common");

  type Phase = "masked" | "confirming" | "revealing" | "revealed";
  const [phase, setPhase] = useState<Phase>("masked");
  // The full CPF lives ONLY here, in memory — never storage, URL, log or state tree.
  const [cpf, setCpf] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function remask() {
    if (timer.current) clearTimeout(timer.current);
    setCpf(null);
    setPhase("masked");
    setError(null);
  }

  // Leaving the screen (or re-render teardown) scrubs the CPF and its timer.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function confirmReveal() {
    setPhase("revealing");
    setError(null);
    try {
      const value = await revealOwnerCpf(userId, owner.id);
      setCpf(value);
      setPhase("revealed");
      timer.current = setTimeout(remask, CPF_REVEAL_MS);
    } catch (err) {
      setPhase("confirming");
      setError(
        err instanceof ApiError && err.status === 429
          ? t("owners.revealRateLimited")
          : t("owners.revealError"),
      );
    }
  }

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{owner.fullName}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {phase === "revealed" && cpf ? formatCpf(cpf) : owner.cpfMasked}
          </p>
        </div>
        {owner.ownershipPercent != null && (
          <span className="text-xs text-muted-foreground">{owner.ownershipPercent}%</span>
        )}
        {owner.role && <span className="text-xs text-muted-foreground">{owner.role}</span>}
        {(owner.isPep || owner.relatedToPep) && <PepTag isPep />}

        <div className="flex items-center gap-1">
          {owner.cpfRevealable &&
            (phase === "revealed" ? (
              <button
                type="button"
                onClick={remask}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-primary hover:underline"
              >
                <EyeOff className="h-4 w-4" />
                {tc("hide")}
              </button>
            ) : (
              <button
                type="button"
                disabled={phase === "revealing"}
                onClick={() => setPhase("confirming")}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                {t("owners.reveal")}
              </button>
            ))}
          <button
            type="button"
            onClick={onEdit}
            aria-label={t("owners.edit")}
            title={t("owners.edit")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={t("owners.remove")}
            title={t("owners.remove")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {phase === "confirming" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
          <p className="flex flex-1 items-start gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {t("owners.revealWarning")}
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={remask}>
              {tc("cancel")}
            </Button>
            <Button type="button" size="sm" onClick={confirmReveal}>
              {t("owners.revealConfirm")}
            </Button>
          </div>
        </div>
      )}
      {phase === "revealing" && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner size="sm" /> {tc("loading")}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </li>
  );
}

// ─── Diligence ─────────────────────────────────────────────────────────────────

function DiligenceForm({
  detail,
  onSaved,
}: {
  detail: ClientDetail;
  onSaved: (d: ClientDetail) => void;
}) {
  const t = useTranslations("admin.review");
  const tc = useTranslations("admin.common");
  const trisk = useTranslations("admin.risk");

  const r = detail.review;
  const anyOwnerPep = detail.owners.some((o) => o.isPep || o.relatedToPep);
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "">(r?.riskLevel ?? "");
  const [riskRationale, setRiskRationale] = useState(r?.riskRationale ?? "");
  const [isPep, setIsPep] = useState(r?.isPep ?? false);
  const [pepNotes, setPepNotes] = useState(r?.pepNotes ?? "");
  const [sourceOfFunds, setSourceOfFunds] = useState(r?.sourceOfFundsNotes ?? "");
  const [volume, setVolume] = useState(
    r?.projectedMonthlyVolumeBrl != null ? String(r.projectedMonthlyVolumeBrl) : "",
  );
  const [publicFunds, setPublicFunds] = useState<boolean | null>(
    r?.publicFundsInvolved ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const forceHigh = isPep || publicFunds === true || anyOwnerPep;
  const effectiveRisk: RiskLevel | "" = forceHigh ? "HIGH" : riskLevel;

  async function save() {
    setBusy(true);
    setFormError(null);
    const payload: UpsertReviewPayload = {
      riskLevel: (effectiveRisk || null) as RiskLevel | null,
      riskRationale,
      isPep,
      pepNotes,
      sourceOfFundsNotes: sourceOfFunds,
      publicFundsInvolved: publicFunds ?? undefined,
    };
    const vol = Number(volume.replace(",", "."));
    if (volume.trim() !== "" && Number.isFinite(vol)) payload.projectedMonthlyVolumeBrl = vol;
    try {
      onSaved(await saveReview(detail.userId, payload));
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.code && BUSINESS_CODES.has(err.code)
          ? err.message
          : tc("actionError"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={t("diligence.title")}>
      <div className="flex flex-col gap-4">
        <fieldset className="border-0 p-0">
          <legend className="mb-1.5 p-0 text-xs font-semibold text-foreground">
            {t("diligence.riskLevel")}
          </legend>
          <div className="flex gap-2">
            {RISK_OPTIONS.map((lvl) => {
              const disabled = forceHigh && lvl !== "HIGH";
              const active = effectiveRisk === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => setRiskLevel(lvl)}
                  className={cn(
                    "h-11 rounded-full border px-4 text-sm font-semibold transition-colors disabled:opacity-40",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {trisk(lvl)}
                </button>
              );
            })}
          </div>
          {forceHigh && (
            <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
              {t("diligence.pepFloor")}
            </p>
          )}
        </fieldset>

        <Field label={t("diligence.riskRationale")}>
          <Textarea value={riskRationale} onChange={setRiskRationale} />
        </Field>
        <Field label={t("diligence.sourceOfFunds")}>
          <Textarea value={sourceOfFunds} onChange={setSourceOfFunds} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("diligence.monthlyVolume")}>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="text-sm text-muted-foreground">R$</span>
              <input
                inputMode="decimal"
                value={volume}
                onChange={(e) => setVolume(e.target.value.replace(/[^\d.,]/g, ""))}
                className="w-full bg-transparent text-sm text-foreground outline-none"
              />
            </div>
          </Field>
          <Field label={t("diligence.publicFunds")}>
            <YesNo value={publicFunds} onChange={setPublicFunds} />
          </Field>
        </div>

        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isPep}
            onChange={(e) => setIsPep(e.target.checked)}
            className="h-5 w-5 accent-[#0b6b4f]"
          />
          {t("diligence.isPep")}
        </label>

        {isPep && (
          <Field label={t("diligence.pepNotes")}>
            <Textarea value={pepNotes} onChange={setPepNotes} />
          </Field>
        )}

        {formError && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {formError}
          </p>
        )}

        <div>
          <Button type="button" size="md" onClick={save} disabled={busy}>
            {busy ? tc("saving") : t("diligence.save")}
          </Button>
        </div>
      </div>
    </Section>
  );
}

// ─── Documents (present = Enviado + Abrir; missing standard type = Pendente) ────

function DocumentsSection({
  userId,
  documents,
}: {
  userId: string;
  documents: ClientDetail["documents"];
}) {
  const t = useTranslations("admin.review");
  const tt = useTranslations("admin.review.documents.types");

  const byType = new Map(documents.map((d) => [d.type, d]));
  // Every standard type gets a row; any extra uploaded type is appended.
  const extra = documents.filter((d) => !DOC_TYPES.includes(d.type as never));
  const rows: Array<{ type: string; doc: ClientDetail["documents"][number] | undefined }> = [
    ...DOC_TYPES.map((type) => ({ type, doc: byType.get(type) })),
    ...extra.map((d) => ({ type: d.type, doc: d })),
  ];
  const typeLabel = (type: string) => (tt.has(type) ? tt(type) : type);

  return (
    <Section title={t("documents.title")}>
      <ul className="flex flex-col gap-2">
        {rows.map(({ type, doc }) => (
          <DocumentRow
            key={type}
            userId={userId}
            label={typeLabel(type)}
            doc={doc}
          />
        ))}
      </ul>
      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        {t("documents.accessNote")}
      </p>
    </Section>
  );
}

function DocumentRow({
  userId,
  label,
  doc,
}: {
  userId: string;
  label: string;
  doc: ClientDetail["documents"][number] | undefined;
}) {
  const t = useTranslations("admin.review");
  const tc = useTranslations("admin.common");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function open() {
    if (!doc || busy) return;
    setBusy(true);
    setError(false);
    // Open the tab synchronously on the click so the pop-up blocker allows it,
    // then point it at the signed URL once we have it. opener is severed for
    // noopener semantics; the URL is never stored or logged.
    const win = window.open("about:blank", "_blank");
    if (win) win.opener = null;
    try {
      const url = await accessDocument(userId, doc.id);
      if (!url) throw new Error("no url");
      if (win) {
        win.location.href = url;
      } else {
        // Pop-up was blocked; fall back to a direct, isolated open.
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch {
      if (win) win.close();
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {doc
            ? t("documents.sentAt", { date: formatDateTimeBR(doc.uploadedAt) || "—" })
            : t("documents.pending")}
          {doc?.fileName ? ` · ${doc.fileName}` : ""}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-xs font-medium text-destructive">
            {t("documents.openError")}
          </p>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!doc || busy}
        onClick={open}
      >
        <ExternalLink className="h-4 w-4" />
        {busy ? tc("loading") : t("documents.open")}
      </Button>
    </li>
  );
}

