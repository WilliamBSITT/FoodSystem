"use client";

import { useEffect, useRef, useState } from "react";

const TOAST_DURATION_MS = 5000;

export function useAutoDismissToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearToast() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToastMessage(null);
  }

  function showToast(message: string) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToastMessage(message);
    timeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      timeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    toastMessage,
    showToast,
    clearToast,
  };
}
