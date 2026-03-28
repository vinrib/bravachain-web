"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import ptMessages from "@/locales/pt.json";
import enMessages from "@/locales/en.json";

export type Locale = "pt" | "en";

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nCtx>({
  locale: "pt",
  setLocale: () => {},
});

export function useLocale() {
  return useContext(I18nContext);
}

const MESSAGES: Record<Locale, object> = {
  pt: ptMessages,
  en: enMessages,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("bravachain_lang");
    if (saved === "pt" || saved === "en") setLocaleState(saved);
    setMounted(true);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("bravachain_lang", l);
  }

  // Suppress hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <NextIntlClientProvider locale="pt" messages={ptMessages}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}

/** Language toggle button for use in Navbar */
export function LangToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
      className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Alternar idioma"
      title={locale === "pt" ? "Switch to English" : "Mudar para Português"}
    >
      {locale === "pt" ? "🇧🇷" : "🇺🇸"}
    </button>
  );
}
