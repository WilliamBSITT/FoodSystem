"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Helper to get theme colors that works during SSR
function getThemeColors() {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return { bgColor: "#f5f5f8", textColor: "#1f2127" };
  }

  const storedTheme = localStorage.getItem("preferred-theme");
  const isDark =
    storedTheme === "dark" ||
    (storedTheme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return {
    bgColor: isDark ? "#0b1020" : "#f5f5f8",
    textColor: isDark ? "#f4f0ff" : "#1f2127",
  };
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const nextPath = pathname && pathname.length > 0 ? pathname : "/";
  const loginUrl = `/login?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    const id = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        setIsAllowed(false);
        setIsChecking(false);
        router.replace(loginUrl);
        return;
      }

      setIsAllowed(true);
      setIsChecking(false);
    }

    void verifySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session) {
        setIsAllowed(false);
        router.replace(loginUrl);
        return;
      }

      setIsAllowed(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loginUrl, router]);

  if (!isMounted) {
    const colors = getThemeColors();
    return (
      <div
        suppressHydrationWarning
        style={{
          minHeight: "100vh",
          width: "100%",
          backgroundColor: colors.bgColor,
          color: colors.textColor,
        }}
      />
    );
  }

  if (isChecking || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-sm text-[var(--muted)]">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
