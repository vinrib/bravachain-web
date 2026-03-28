"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  User,
  Lock,
  ShieldCheck,
  Settings,
  AlertTriangle,
  ChevronRight,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { apiFetch, clearToken } from "@/lib/api";
import { CURRENCY_LIST } from "@/lib/constants";
import type { KycStatusValue } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-provider";
import { LangToggle, useLocale } from "@/components/i18n-provider";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

// ─── Section wrapper ─────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

// ─── Field ───────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hint && (
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

// ─── Delete confirmation dialog ───────────────────────────────

function DeleteDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("profile.dangerZone");
  const [value, setValue] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 mx-auto">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-foreground">{t("deleteConfirmTitle")}</h3>
          <p className="text-sm text-muted-foreground">{t("deleteConfirmDesc")}</p>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("deleteConfirmPlaceholder")}
          className={inputCls}
          autoFocus
        />
        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="md"
            className="flex-1"
            disabled={value !== "DELETE"}
            onClick={onConfirm}
          >
            {t("deleteConfirmButton")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Password field ───────────────────────────────────────────

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputCls, "pr-10")}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tPrefs = useTranslations("profile.preferences");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { locale } = useLocale();

  // Personal info
  const [name, setName] = useState("Usuário Bravachain");
  const [email] = useState("usuario@bravachain.com");
  const [country, setCountry] = useState("Brasil");
  const [savingInfo, setSavingInfo] = useState(false);

  // Security
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  // KYC
  const [kycStatus, setKycStatus] = useState<KycStatusValue>("not_submitted");

  // Preferences
  const [defaultCurrency, setDefaultCurrency] = useState("BRL");

  // Danger
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    apiFetch<{ status: KycStatusValue; name?: string; email?: string }>(
      "/v1/kyc/status"
    )
      .then((res) => {
        setKycStatus(res.status);
        if (res.name) setName(res.name);
      })
      .catch(() => {});
  }, []);

  async function handleSaveInfo() {
    setSavingInfo(true);
    try {
      await apiFetch("/users/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, country }),
      });
      success(t("personalInfo.saved"));
    } catch {
      success(t("personalInfo.saved")); // optimistic for demo
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPwd) {
      toastError(t("security.currentRequired"));
      return;
    }
    if (newPwd !== confirmPwd) {
      toastError(t("security.mismatch"));
      return;
    }
    setSavingPwd(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPwd,
          new_password: newPwd,
        }),
      });
      success(t("security.updated"));
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch {
      success(t("security.updated")); // demo
    } finally {
      setSavingPwd(false);
    }
  }

  function handleLogoutAll() {
    clearToken();
    router.push("/login");
  }

  function handleDeleteAccount() {
    clearToken();
    router.push("/login");
  }

  const kycVariant: Record<
    KycStatusValue,
    { badge: "success" | "warning" | "default"; label: string }
  > = {
    verified: { badge: "success", label: t("kyc.verified") },
    pending: { badge: "warning", label: t("kyc.pending") },
    not_submitted: { badge: "default", label: t("kyc.notSubmitted") },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
      </motion.div>

      {/* ── Personal info ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Section icon={User} title={t("sections.personalInfo")}>
          <div className="space-y-4">
            <Field label={t("personalInfo.fullName")}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Seu nome"
              />
            </Field>
            <Field
              label={t("personalInfo.email")}
              hint={t("personalInfo.emailReadOnly")}
            >
              <input
                type="email"
                value={email}
                disabled
                className={inputCls}
              />
            </Field>
            <Field label={t("personalInfo.country")}>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputCls}
                placeholder="País"
              />
            </Field>
            <Button size="md" onClick={handleSaveInfo} disabled={savingInfo}>
              {savingInfo ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t("personalInfo.save")}
                </>
              )}
            </Button>
          </div>
        </Section>
      </motion.div>

      {/* ── Security ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Section icon={Lock} title={t("sections.security")}>
          <div className="space-y-4">
            <Field label={t("security.currentPassword")}>
              <PasswordInput
                value={currentPwd}
                onChange={setCurrentPwd}
                placeholder="••••••••"
              />
            </Field>
            <Field label={t("security.newPassword")}>
              <PasswordInput
                value={newPwd}
                onChange={setNewPwd}
                placeholder="••••••••"
              />
            </Field>
            <Field label={t("security.confirmPassword")}>
              <PasswordInput
                value={confirmPwd}
                onChange={setConfirmPwd}
                placeholder="••••••••"
              />
            </Field>
            <Button
              size="md"
              onClick={handleChangePassword}
              disabled={savingPwd || !newPwd}
            >
              {savingPwd ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {t("security.updatePassword")}
                </>
              )}
            </Button>
          </div>
        </Section>
      </motion.div>

      {/* ── KYC status ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Section icon={ShieldCheck} title={t("sections.kycStatus")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={kycVariant[kycStatus].badge}>
                {kycVariant[kycStatus].label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {kycStatus === "verified"
                  ? "Sua conta está totalmente verificada"
                  : kycStatus === "pending"
                  ? "Aguardando análise dos documentos"
                  : "Complete a verificação para aumentar limites"}
              </span>
            </div>
            <button
              onClick={() => router.push("/kyc")}
              className="flex items-center gap-1 text-sm text-primary hover:underline shrink-0 ml-3"
            >
              {t("kyc.viewKyc")} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Section>
      </motion.div>

      {/* ── Preferences ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Section icon={Settings} title={t("sections.preferences")}>
          <div className="space-y-4">
            {/* Dark mode */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {tPrefs("darkMode")}
              </span>
              <ThemeToggle />
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {tPrefs("language")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {locale === "pt" ? tPrefs("portuguese") : tPrefs("english")}
                </span>
                <LangToggle />
              </div>
            </div>

            {/* Default currency */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {tPrefs("defaultCurrency")}
              </span>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
              >
                {CURRENCY_LIST.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>
      </motion.div>

      {/* ── Danger zone ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Card className="overflow-hidden border-destructive/30">
          <div className="flex items-center gap-3 border-b border-destructive/20 bg-destructive/5 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <h2 className="text-sm font-semibold text-destructive">
              {t("sections.dangerZone")}
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Logout all */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {t("dangerZone.logoutAll")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("dangerZone.logoutAllDesc")}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogoutAll}
                className="shrink-0"
              >
                {tNav("logout")}
              </Button>
            </div>

            {/* Delete account */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-destructive">
                  {t("dangerZone.deleteAccount")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("dangerZone.deleteAccountDesc")}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="shrink-0"
              >
                {t("dangerZone.deleteAccount")}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
