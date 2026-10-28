"use client";

import { useTranslations } from "next-intl";

/**
 * Placeholder body for admin sections that aren't built yet (compliance review,
 * admin management). The real screens land in a later PR.
 */
export function AdminConstruction({
  section,
}: {
  section: "clients" | "security";
}) {
  const t = useTranslations("admin");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">
          {t(`${section}.title`)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t(`${section}.body`)}</p>
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("construction.badge")}
        </span>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          {t("construction.body")}
        </p>
      </div>
    </div>
  );
}
