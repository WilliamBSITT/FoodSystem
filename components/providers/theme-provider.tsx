"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-service";

export type ThemeMode = "light" | "dark" | "system";

type UserPreferenceMetadata = {
  pref_theme?: ThemeMode;
};

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "preferred-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const themeRef = useRef<ThemeMode>("light");

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    let mounted = true;

    async function resolveThemeFromProfile() {
      const storedTheme = typeof window !== "undefined" ? window.localStorage.getItem(THEME_STORAGE_KEY) : null;

      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
        setThemeState(storedTheme);
        const nextResolved = storedTheme === "system" ? getSystemTheme() : storedTheme;
        setResolvedTheme(nextResolved);
        applyTheme(storedTheme);
      }

      const { data } = await getCurrentUser();
      const profileTheme = (data.user?.user_metadata as UserPreferenceMetadata | undefined)?.pref_theme;
      const nextTheme: ThemeMode = profileTheme ?? (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system" ? storedTheme : "light");

      if (!mounted) {
        return;
      }

      setThemeState(nextTheme);
      const nextResolved = nextTheme === "system" ? getSystemTheme() : nextTheme;
      setResolvedTheme(nextResolved);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }

      applyTheme(nextTheme);
    }

    void resolveThemeFromProfile();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      setResolvedTheme((currentResolved) => {
        if (themeRef.current !== "system") {
          return currentResolved;
        }

        const nextResolved = getSystemTheme();
        applyTheme("system");
        return nextResolved;
      });
    };

    mediaQuery.addEventListener("change", handleSystemChange);

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const profileTheme = (session?.user?.user_metadata as UserPreferenceMetadata | undefined)?.pref_theme;
      const nextTheme: ThemeMode = profileTheme ?? "light";
      setThemeState(nextTheme);
      const nextResolved = nextTheme === "system" ? getSystemTheme() : nextTheme;
      setResolvedTheme(nextResolved);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }
      applyTheme(nextTheme);
    });

    return () => {
      mounted = false;
      mediaQuery.removeEventListener("change", handleSystemChange);
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    const nextResolved = nextTheme === "system" ? getSystemTheme() : nextTheme;
    setResolvedTheme(nextResolved);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    }
    applyTheme(nextTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}