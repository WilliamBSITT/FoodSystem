"use client";

import { useEffect, useState } from "react";

export type InventoryViewMode = "classic" | "grouped";

const INVENTORY_VIEW_MODE_KEY = "inventory-view-mode";

export function useInventoryViewMode() {
  const [viewMode, setViewModeState] = useState<InventoryViewMode>(() => {
    if (typeof window === "undefined") {
      return "classic";
    }

    const savedMode = window.localStorage.getItem(INVENTORY_VIEW_MODE_KEY);
    return savedMode === "classic" || savedMode === "grouped" ? savedMode : "classic";
  });

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== INVENTORY_VIEW_MODE_KEY) {
        return;
      }

      if (event.newValue === "classic" || event.newValue === "grouped") {
        setViewModeState(event.newValue);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function setViewMode(mode: InventoryViewMode) {
    setViewModeState(mode);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(INVENTORY_VIEW_MODE_KEY, mode);
    }
  }

  return {
    viewMode,
    setViewMode,
  };
}
