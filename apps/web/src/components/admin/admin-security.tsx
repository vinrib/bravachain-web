"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MFA_ENROLLMENT_PATH } from "@/lib/mfa/routes";

export function AdminSecurity() {
  const t = useTranslations("admin");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">
          {t("security.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("security.body")}</p>
      </div>

      {/* The one live security feature so far: MFA activation. */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">{t("security.mfaCardTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("security.mfaCardBody")}
            </p>
          </div>
        </div>
        <Button asChild size="md" className="shrink-0">
          <Link href={MFA_ENROLLMENT_PATH}>{t("security.mfaCardAction")}</Link>
        </Button>
      </div>
    </div>
  );
}
