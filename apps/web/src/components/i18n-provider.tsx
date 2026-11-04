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
import esMessages from "@/locales/es.json";

export type Locale = "pt" | "en" | "es";

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
  es: esMessages,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("bravachain_lang");
    // Intentional one-time sync of the saved locale on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "pt" || saved === "en" || saved === "es") setLocaleState(saved);
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
