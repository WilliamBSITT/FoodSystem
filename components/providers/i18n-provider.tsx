"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-service";
import { translate, type SupportedLanguage, type TranslationKey } from "@/lib/i18n";

type UserPreferenceMetadata = {
  pref_language?: SupportedLanguage;
};

type I18nContextValue = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const LANGUAGE_STORAGE_KEY = "preferred-language";

function applyDocumentLanguage(language: SupportedLanguage) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    let mounted = true;

    async function resolveLanguageFromProfile() {
      const storedLanguage = typeof window !== "undefined"
        ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
        : null;

      if (storedLanguage === "fr" || storedLanguage === "en") {
        setLanguageState(storedLanguage);
        applyDocumentLanguage(storedLanguage);
      }

      const { data } = await getCurrentUser();
      const profileLanguage = (data.user?.user_metadata as UserPreferenceMetadata | undefined)?.pref_language;
      const nextLanguage: SupportedLanguage = profileLanguage === "fr" ? "fr" : storedLanguage === "fr" ? "fr" : "en";

      if (!mounted) return;

      setLanguageState(nextLanguage);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      }
      applyDocumentLanguage(nextLanguage);
    }

    void resolveLanguageFromProfile();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const profileLanguage = (session?.user?.user_metadata as UserPreferenceMetadata | undefined)?.pref_language;
      const nextLanguage: SupportedLanguage = profileLanguage === "fr" ? "fr" : "en";
      setLanguageState(nextLanguage);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      }
      applyDocumentLanguage(nextLanguage);
    });

    return () => {
      mounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const setLanguage = useCallback((nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }
    applyDocumentLanguage(nextLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) => translate(language, key, values),
    [language],
  );

  const value: I18nContextValue = {
    language,
    setLanguage,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
