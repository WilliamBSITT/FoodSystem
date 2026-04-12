"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getUserScopedCacheKey,
  readClientCache,
  writeClientCache,
} from "@/lib/client-cache";
import { getCurrentUser } from "@/lib/auth-service";
import {
  normalizeQuickFilterRow,
  toQuickFilterRow,
  type DashboardQuickFilterRow,
  type QuickFilterDraft,
} from "@/lib/quick-filters-config";

export function useDashboardQuickFilters() {
  const [userId, setUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState<QuickFilterDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilters = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: userData, error: userError } = await getCurrentUser();

    if (userError || !userData.user) {
      setUserId(null);
      setFilters([]);
      setLoading(false);
      return [] as QuickFilterDraft[];
    }

    setUserId(userData.user.id);
    const cacheKey = getUserScopedCacheKey("dashboard-quick-filters", userData.user.id);
    const cachedFilters = readClientCache<QuickFilterDraft[]>(cacheKey);

    if (cachedFilters) {
      setFilters(cachedFilters.data);
    }

    const { data, error: loadError } = await supabase
      .from("dashboard_quick_filters")
      .select("id,kind,target_value,custom_title,custom_description,icon,accent_color,order_index")
      .eq("user_id", userData.user.id)
      .order("order_index", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setFilters([]);
      setLoading(false);
      return [] as QuickFilterDraft[];
    }

    const nextFilters = ((data ?? []) as DashboardQuickFilterRow[])
      .map((row) => normalizeQuickFilterRow(row));

    setFilters(nextFilters);
    writeClientCache(cacheKey, nextFilters);
    setLoading(false);
    return nextFilters;
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFilters();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadFilters]);

  const saveFilters = useCallback(
    async (nextFilters: QuickFilterDraft[]) => {
      if (!userId) {
        setError("Unable to resolve current user.");
        return false;
      }

      setSaving(true);
      setError(null);

      if (nextFilters.length === 0) {
        const expectedToDelete = filters.length;
        const { data: deletedRows, error: deleteError } = await supabase
          .from("dashboard_quick_filters")
          .delete()
          .eq("user_id", userId)
          .select("id");

        if (deleteError) {
          setSaving(false);
          setError(deleteError.message);
          return false;
        }

        const deletedCount = (deletedRows ?? []).length;

        if (expectedToDelete > 0 && deletedCount === 0) {
          setSaving(false);
          setError("No quick filter was deleted from the database.");
          return false;
        }

        writeClientCache(getUserScopedCacheKey("dashboard-quick-filters", userId), []);
        await loadFilters();
        setSaving(false);
        return true;
      }

      const nextRows = nextFilters.map((draft, index) => ({
        ...toQuickFilterRow(draft, index),
        user_id: userId,
      }));

      const { error: upsertError } = await supabase
        .from("dashboard_quick_filters")
        .upsert(nextRows, { onConflict: "id" });

      if (upsertError) {
        setSaving(false);
        setError(upsertError.message);
        return false;
      }

      const removedIds = filters
        .map((filter) => filter.id)
        .filter((id) => !nextRows.some((row) => row.id === id));

      if (removedIds.length > 0) {
        const { error: removeError } = await supabase
          .from("dashboard_quick_filters")
          .delete()
          .eq("user_id", userId)
          .in("id", removedIds);

        if (removeError) {
          setSaving(false);
          setError(removeError.message);
          return false;
        }
      }

      const refreshed = await loadFilters();
      writeClientCache(getUserScopedCacheKey("dashboard-quick-filters", userId), refreshed);
      setFilters(refreshed);
      setSaving(false);
      return true;
    },
    [filters, loadFilters, userId],
  );

  return {
    filters,
    loading,
    saving,
    error,
    loadFilters,
    saveFilters,
  };
}