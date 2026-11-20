"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { ADMIN_SECURITY } from "@/lib/mfa/routes";

export function AdminOverview() {
  const t = useTranslations("admin");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">
          {t("overview.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("overview.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={ADMIN_SECURITY}
          className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="font-serif text-lg font-bold text-foreground">{t("security.title")}</span>
          <span className="text-sm text-muted-foreground">{t("security.body")}</span>
        </Link>
      </div>
    </div>
  );
}
