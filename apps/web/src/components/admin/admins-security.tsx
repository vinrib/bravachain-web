"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { KeyRound, ShieldAlert, UserPlus, Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/client-api";
import { useAdminIdentity } from "@/lib/hooks";
import { useDebounced } from "@/lib/admin/use-debounced";
import { formatDateTimeBR, formatDateBR } from "@/lib/admin/format";
import {
  listAdmins,
  searchUsers,
  changeRole,
  resetUserMfa,
} from "@/lib/admin/users";
import { mfaStatus } from "@/lib/mfa/api";
import {
  MFA_RECOVERY_CODES_LOW,
  MFA_RECOVERY_CODES_TOTAL,
  type AdminUser,
  type MfaStatus,
  type UserSearchResult,
} from "@/lib/admin/types";
import { MFA_ENROLLMENT_PATH } from "@/lib/mfa/routes";
import { ReasonModal } from "./reason-modal";
import { RegenerateCodesModal } from "./regenerate-codes-modal";

export function AdminsSecurity() {
  const t = useTranslations("admin.security");
  const tc = useTranslations("admin.common");
  const me = useAdminIdentity();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [roleMgmtDisabled, setRoleMgmtDisabled] = useState(false);
  const [myMfa, setMyMfa] = useState<MfaStatus | null>(null);

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [demoteTarget, setDemoteTarget] = useState<AdminUser | null>(null);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await listAdmins(1, 50);
      setAdmins(res.items);
      setTotal(res.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMfa = useCallback(async () => {
    try {
      setMyMfa(await mfaStatus());
    } catch {
      setMyMfa(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    void loadMfa();
  }, [load, loadMfa]);

  const onlyOneAdmin = total <= 1;

  /** Shared 404 handling: the role route 404s when management is disabled. */
  function handleRoleError(err: unknown): boolean {
    if (err instanceof ApiError && err.status === 404) {
      setRoleMgmtDisabled(true);
      return true; // handled → resolve so the modal closes and the banner shows
    }
    return false;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-[26px] font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {roleMgmtDisabled && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{t("roleMgmtDisabled")}</span>
        </div>
      )}

      {/* Admins table */}
      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <h2 className="font-serif text-lg font-bold text-foreground">{t("adminsTitle")}</h2>
          <Button type="button" size="sm" onClick={() => setPromoteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            {t("promote")}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Spinner size="sm" /> {tc("loading")}
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-destructive">{tc("loadError")}</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_96px_110px_150px_210px] gap-3 border-b border-border px-4 py-3 text-xs font-semibold text-muted-foreground">
                <span>{t("colName")}</span>
                <span>{t("colEmail")}</span>
                <span>{t("colRole")}</span>
                <span>{t("colMfa")}</span>
                <span>{t("colLastLogin")}</span>
                <span>{t("colActions")}</span>
              </div>
              {admins.map((u) => (
                <AdminRow
                  key={u.userId}
                  user={u}
                  isSelf={u.userId === me.userId}
                  onlyOneAdmin={onlyOneAdmin}
                  onReset={() => setResetTarget(u)}
                  onDemote={() => setDemoteTarget(u)}
                />
              ))}
            </div>
            {/* Mobile cards */}
            <ul className="divide-y divide-border md:hidden">
              {admins.map((u) => (
                <AdminCard
                  key={u.userId}
                  user={u}
                  isSelf={u.userId === me.userId}
                  onlyOneAdmin={onlyOneAdmin}
                  onReset={() => setResetTarget(u)}
                  onDemote={() => setDemoteTarget(u)}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Fixed notes */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {t("roleTakesEffectNote")}
        </p>
        <p className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {t("auditNote")}
        </p>
      </div>

      {/* My two-step verification */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">{t("myMfaTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {myMfa?.enabled
                  ? myMfa.enabledAt
                    ? t("myMfaActiveAt", { date: formatDateBR(myMfa.enabledAt) })
                    : t("myMfaActive")
                  : t("myMfaInactive")}
              </p>
            </div>
          </div>
          {myMfa?.enabled ? (
            <Button type="button" size="md" variant="secondary" onClick={() => setRegenOpen(true)}>
              {t("regen.open")}
            </Button>
          ) : (
            <Button asChild size="md">
              <Link href={MFA_ENROLLMENT_PATH}>{t("activate")}</Link>
            </Button>
          )}
        </div>
        {myMfa?.enabled &&
          myMfa.recoveryCodesRemaining !== null &&
          myMfa.recoveryCodesRemaining <= MFA_RECOVERY_CODES_LOW && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {t("recoveryLow", {
                n: myMfa.recoveryCodesRemaining,
                total: MFA_RECOVERY_CODES_TOTAL,
              })}
            </p>
          )}
        {myMfa?.enabled && (
          <p className="mt-3 text-xs text-muted-foreground">{t("regen.hint")}</p>
        )}
      </section>

      {/* Reset MFA modal */}
      <ReasonModal
        open={resetTarget !== null}
        onOpenChange={(o) => !o && setResetTarget(null)}
        title={t("resetMfaTitle", { name: resetTarget?.name ?? resetTarget?.email ?? "" })}
        description={t("resetMfaBody")}
        auditNote={t("auditNote")}
        reasonLabel={t("reasonLabel")}
        confirmLabel={t("resetMfa")}
        destructive
        onConfirm={async (reason) => {
          if (!resetTarget) return;
          await resetUserMfa(resetTarget.userId, reason);
          await load();
          setResetTarget(null);
        }}
      />

      {/* Demote modal */}
      <ReasonModal
        open={demoteTarget !== null}
        onOpenChange={(o) => !o && setDemoteTarget(null)}
        title={t("demoteTitle", { name: demoteTarget?.name ?? demoteTarget?.email ?? "" })}
        description={t("demoteBody")}
        auditNote={t("auditNote")}
        reasonLabel={t("reasonLabel")}
        confirmLabel={t("demote")}
        destructive
        onConfirm={async (reason) => {
          if (!demoteTarget) return;
          try {
            await changeRole(demoteTarget.userId, "USER", reason);
          } catch (err) {
            if (handleRoleError(err)) {
              setDemoteTarget(null);
              return;
            }
            throw err;
          }
          await load();
          setDemoteTarget(null);
        }}
      />

      {/* Promote modal */}
      <PromoteModal
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        onPromote={async (userId, reason) => {
          try {
            await changeRole(userId, "ADMIN", reason);
          } catch (err) {
            if (handleRoleError(err)) return;
            throw err;
          }
          await load();
        }}
      />

      <RegenerateCodesModal
        open={regenOpen}
        onOpenChange={setRegenOpen}
        onDone={() => void loadMfa()}
      />
    </div>
  );
}

function MfaStatus({ enabled }: { enabled: boolean }) {
  const t = useTranslations("admin.security");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        enabled
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
          : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
      )}
    >
      {enabled ? t("mfaOn") : t("mfaPending")}
    </span>
  );
}

function RowActions({
  isSelf,
  onlyOneAdmin,
  onReset,
  onDemote,
}: {
  isSelf: boolean;
  onlyOneAdmin: boolean;
  onReset: () => void;
  onDemote: () => void;
}) {
  const t = useTranslations("admin.security");
  const demoteDisabled = isSelf || onlyOneAdmin;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onReset}
        disabled={isSelf}
        className="min-h-[36px] rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title={isSelf ? t("selfDisabled") : undefined}
      >
        {t("resetMfa")}
      </button>
      <button
        type="button"
        onClick={onDemote}
        disabled={demoteDisabled}
        className="min-h-[36px] rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-40"
        title={
          isSelf ? t("selfDisabled") : onlyOneAdmin ? t("lastAdminDisabled") : undefined
        }
      >
        {t("demote")}
      </button>
    </div>
  );
}

function AdminRow({
  user,
  isSelf,
  onlyOneAdmin,
  onReset,
  onDemote,
}: {
  user: AdminUser;
  isSelf: boolean;
  onlyOneAdmin: boolean;
  onReset: () => void;
  onDemote: () => void;
}) {
  const t = useTranslations("admin.security");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_96px_110px_150px_210px] items-center gap-3 border-b border-border px-4 py-3 text-sm last:border-0">
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium text-foreground">{user.name ?? "—"}</span>
        {isSelf && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {t("you")}
          </span>
        )}
      </span>
      <span className="truncate text-muted-foreground">{user.email ?? "—"}</span>
      <span className="text-foreground">{t(`role.${user.role}`)}</span>
      <span><MfaStatus enabled={user.mfaEnabled} /></span>
      <span className="text-xs text-muted-foreground">
        {formatDateTimeBR(user.lastLoginAt) || "—"}
      </span>
      <RowActions
        isSelf={isSelf}
        onlyOneAdmin={onlyOneAdmin}
        onReset={onReset}
        onDemote={onDemote}
      />
    </div>
  );
}

function AdminCard({
  user,
  isSelf,
  onlyOneAdmin,
  onReset,
  onDemote,
}: {
  user: AdminUser;
  isSelf: boolean;
  onlyOneAdmin: boolean;
  onReset: () => void;
  onDemote: () => void;
}) {
  const t = useTranslations("admin.security");
  return (
    <li className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <span className="truncate">{user.name ?? "—"}</span>
            {isSelf && (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {t("you")}
              </span>
            )}
          </p>
          <p className="truncate text-sm text-muted-foreground">{user.email ?? "—"}</p>
        </div>
        <MfaStatus enabled={user.mfaEnabled} />
      </div>
      <p className="text-xs text-muted-foreground">
        {t(`role.${user.role}`)} · {formatDateTimeBR(user.lastLoginAt) || "—"}
      </p>
      <RowActions
        isSelf={isSelf}
        onlyOneAdmin={onlyOneAdmin}
        onReset={onReset}
        onDemote={onDemote}
      />
    </li>
  );
}

// ─── Promote modal (search + reason) ───────────────────────────────────────────

function PromoteModal({
  open,
  onOpenChange,
  onPromote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromote: (userId: string, reason: string) => Promise<void>;
}) {
  const t = useTranslations("admin.security");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const debounced = useDebounced(query.trim(), 350);

  // Reset when the modal opens.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setSearching(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  useEffect(() => {
    if (debounced.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    let active = true;
    setSearching(true);
    searchUsers(debounced)
      .then((r) => active && setResults(r))
      .catch(() => active && setResults([]))
      .finally(() => active && setSearching(false));
    return () => {
      active = false;
    };
  }, [debounced]);

  return (
    <ReasonModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("promoteTitle")}
      description={t("promoteBody")}
      auditNote={t("auditNote")}
      reasonLabel={t("reasonLabel")}
      reasonPlaceholder={t("promoteReasonPlaceholder")}
      confirmLabel={t("promote")}
      confirmDisabled={!selected}
      onConfirm={async (reason) => {
        if (selected) await onPromote(selected.userId, reason);
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="promote-search" className="text-[13.5px] font-semibold text-foreground">
          {t("searchUserLabel")}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="promote-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder={t("searchUserPlaceholder")}
            className="h-11 w-full rounded-xl border border-border bg-input pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {query.trim().length > 0 && query.trim().length < 3 && (
          <span className="text-xs text-muted-foreground">{t("searchUserMin")}</span>
        )}
        {searching && <span className="text-xs text-muted-foreground">{t("searching")}</span>}
        {results.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-xl border border-border p-1">
            {results.map((u) => (
              <li key={u.userId}>
                <button
                  type="button"
                  aria-pressed={selected?.userId === u.userId}
                  onClick={() => setSelected(u)}
                  className={cn(
                    "flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    selected?.userId === u.userId
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <span className="font-medium">{u.name ?? u.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {u.email} · {t(`role.${u.role}`)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ReasonModal>
  );
}
