"use client";

import { useTranslations } from "next-intl";
import { CurrencyChoice } from "@/components/send/currency-choice";

export default function EnviarPage() {
  const t = useTranslations("enviar");
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-[30px] font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <CurrencyChoice />
    </div>
  );
}
