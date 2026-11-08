"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { StepProgress } from "./step-progress";
import { BeneficiaryStep } from "./beneficiary-step";
import { BeneficiaryForm } from "./beneficiary-form";
import { AmountStep } from "./amount-step";
import type { BeneficiarySummary, SendCurrency, SendQuote } from "@/lib/send/types";

/**
 * Internal flow steps. `beneficiario` and `cadastro` share progress position 0
 * ("Beneficiário"); the rest map 1:1 onto the progress bar.
 */
type Step = "beneficiario" | "cadastro" | "valor" | "detalhes" | "revisao" | "status";

const PROGRESS_ORDER: Step[] = ["beneficiario", "valor", "detalhes", "revisao", "status"];
const progressIndex = (step: Step): number => {
  const i = PROGRESS_ORDER.indexOf(step === "cadastro" ? "beneficiario" : step);
  return i < 0 ? 0 : i;
};

/** Where "back" goes from each step. `beneficiario` leaves the flow. */
const BACK: Partial<Record<Step, Step>> = {
  cadastro: "beneficiario",
  valor: "beneficiario",
  detalhes: "valor",
  revisao: "detalhes",
};

export function SendFlow({ currency }: { currency: SendCurrency }) {
  const t = useTranslations("enviar");
  const router = useRouter();
  const [step, setStep] = useState<Step>("beneficiario");
  const [beneficiary, setBeneficiary] = useState<BeneficiarySummary | null>(null);
  const [, setQuote] = useState<SendQuote | null>(null);

  const steps = PROGRESS_ORDER.map((s) => t(`steps.${s}`));
  const idx = progressIndex(step);
  // Valor uses a two-column layout; give it room on desktop.
  const containerWidth = step === "valor" ? "max-w-5xl" : "max-w-3xl";

  function back() {
    const target = BACK[step];
    if (target) setStep(target);
    else router.push("/enviar");
  }

  return (
    <div className={`mx-auto ${containerWidth} space-y-5`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={back}
          aria-label={t("flow.back")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="font-serif text-[26px] font-bold text-foreground">
            {t("flow.title", { currency })}
          </h1>
          <p className="text-[13.5px] text-muted-foreground">{t(`flow.subtitle.${step}`)}</p>
        </div>
      </div>

      <StepProgress
        steps={steps}
        current={idx}
        stepOfLabel={t("flow.stepOf", { n: idx + 1, total: steps.length })}
      />

      {step === "beneficiario" ? (
        <BeneficiaryStep
          currency={currency}
          onSelect={(b) => {
            setBeneficiary(b);
            setStep("valor");
          }}
          onRegister={() => setStep("cadastro")}
        />
      ) : step === "cadastro" ? (
        <BeneficiaryForm
          currency={currency}
          onSaved={(b) => {
            setBeneficiary(b);
            setStep("valor");
          }}
        />
      ) : step === "valor" ? (
        <AmountStep
          currency={currency}
          beneficiaryName={beneficiary?.name ?? ""}
          onContinue={(q) => {
            setQuote(q);
            setStep("detalhes");
          }}
        />
      ) : (
        // TODO Fatia 5+: Detalhes, Revisão, Status.
        <ComingSoon label={t("flow.comingSoon")} onBack={back} backLabel={t("flow.back")} />
      )}
    </div>
  );
}

function ComingSoon({
  label,
  onBack,
  backLabel,
}: {
  label: string;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-11 items-center rounded-xl border border-input bg-card px-5 text-sm font-semibold text-foreground hover:border-foreground"
      >
        {backLabel}
      </button>
    </div>
  );
}
