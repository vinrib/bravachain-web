"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { X, Globe, ShieldCheck, Wallet, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bravachain_onboarded";

interface Step {
  key: "welcome" | "kyc" | "deposit" | "send";
  icon: React.ReactNode;
  color: string;
  href?: string;
}

const STEPS: Step[] = [
  {
    key: "welcome",
    icon: <Globe className="h-10 w-10" />,
    color: "text-primary",
  },
  {
    key: "kyc",
    icon: <ShieldCheck className="h-10 w-10" />,
    color: "text-blue-500",
    href: "/kyc",
  },
  {
    key: "deposit",
    icon: <Wallet className="h-10 w-10" />,
    color: "text-purple-500",
    href: "/deposit",
  },
  {
    key: "send",
    icon: <ArrowUpRight className="h-10 w-10" />,
    color: "text-emerald-500",
    href: "/send",
  },
];

export function OnboardingModal() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1=forward, -1=backward

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  function goNext() {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  function handleAction() {
    const step = STEPS[currentStep];
    if (step.href) {
      dismiss();
      router.push(step.href);
    } else {
      goNext();
    }
  }

  const step = STEPS[currentStep];
  const stepKey = step.key;
  const isLast = currentStep === STEPS.length - 1;
  const hasAction = !!step.href;

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label={t("skip")}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            animate={{
              width: `${((currentStep + 1) / STEPS.length) * 100}%`,
            }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          />
        </div>

        {/* Step content */}
        <div className="p-8 pb-6">
          {/* Step counter */}
          <p className="mb-6 text-center text-xs font-medium text-muted-foreground">
            {t("stepOf", { current: currentStep + 1, total: STEPS.length })}
          </p>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="text-center"
            >
              {/* Icon */}
              <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted ${step.color}`}>
                {step.icon}
              </div>

              {/* Text */}
              <h2 className="text-xl font-bold text-foreground">
                {t(`${stepKey}.title`)}
              </h2>
              <p className="mt-1 text-sm font-medium text-primary">
                {t(`${stepKey}.subtitle`)}
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {t(`${stepKey}.description`)}
              </p>

              {/* Step-specific action button */}
              {hasAction && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleAction}
                >
                  {t(`${stepKey}.action` as Parameters<typeof t>[0])}
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-8 py-4 flex items-center justify-between gap-3">
          <button
            onClick={dismiss}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("skip")}
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-5 bg-primary"
                    : i < currentStep
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <Button size="sm" onClick={goNext}>
            {isLast ? t("finish") : t("next")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
